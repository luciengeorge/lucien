import type { TextStreamPart, ToolSet, UIMessage } from "ai";

import { fetchAuthMutation, fetchAuthQuery } from "#/lib/auth-server";
import {
  ChatRequestSchema,
  hasRenderableMessageContent,
  MAX_HISTORY_MESSAGES,
  parseSerializedMessages,
} from "#/lib/chat-types";
import { renderCorpus } from "#/lib/chat/corpus";
import { renderSystemPrompt } from "#/lib/chat/system-prompt";
import { buildChatTools } from "#/lib/chat/tools";
import { getConversationSession } from "#/lib/conversation-session.server";
import { createLogger } from "#/lib/logger";
import { postContactToSlack } from "#/lib/notify-slack";
import { stripDashes } from "#/lib/strip-dashes";
import { openai } from "@ai-sdk/openai";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { waitUntil } from "@vercel/functions";
import { convertToModelMessages, generateId, stepCountIs, streamText, validateUIMessages } from "ai";

import systemPrompt from "../../../../content/system-prompt.md?raw";
import { api } from "../../../../convex/_generated/api";

const logger = createLogger("chat.api");

// The whole corpus is ~9k tokens, small enough to send every time: retrieval
// only added ways to miss (follow-ups, chunks embedded without their title).
const corpus = renderCorpus(
  Object.entries(
    import.meta.glob<string>("../../../../content/**/*.md", { eager: true, import: "default", query: "?raw" }),
  ).map(([path, text]) => ({ path: path.replace(/^.*\/content\//, ""), text })),
);

/**
 * Rewrites streamed text-delta chunks through stripDashes so the client never sees
 * an em-dash or en-dash, even mid-stream. Non-text chunks pass through unchanged.
 */
function stripDashesFromStream<Tools extends ToolSet>(): TransformStream<TextStreamPart<Tools>, TextStreamPart<Tools>> {
  return new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(chunk.type === "text-delta" ? { ...chunk, text: stripDashes(chunk.text) } : chunk);
    },
  });
}

function sanitizeMessageForPersistence(message: UIMessage): UIMessage {
  return {
    ...message,
    parts: message.parts.map((part) => (part.type === "text" ? { ...part, text: stripDashes(part.text) } : part)),
  };
}

export const Route = createFileRoute("/api/chat/")({
  beforeLoad: () => {
    throw notFound();
  },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const requestId = request.headers.get("x-vercel-id") ?? crypto.randomUUID();
        const startedAt = Date.now();
        const parsedBody = ChatRequestSchema.safeParse(await request.json());
        if (!parsedBody.success) {
          logger.warn("chat request invalid", { requestId });
          return new Response("Bad Request", { status: 400 });
        }

        const { id, message } = parsedBody.data;
        const conversationSession = await getConversationSession();
        const sessionId = conversationSession.data.sessionId;
        // Ownership is checked by getConversationById's sessionId filter below, not
        // against the cookie, which only names the newest conversation.
        if (!sessionId) {
          logger.warn("chat request rejected", { requestId });
          return new Response("Unauthorized", { status: 401 });
        }

        const ip =
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          request.headers.get("x-vercel-id") ||
          "unknown";
        const rateLimitStatus = await fetchAuthMutation(api.rateLimits.checkChatRateLimit, {
          ip,
          sessionId,
        });
        if (!rateLimitStatus.allowed) {
          logger.warn("chat rate limited", { requestId });
          return new Response("Too Many Requests", {
            headers: { "Retry-After": String(Math.ceil(rateLimitStatus.retryAfter / 1000)) },
            status: 429,
          });
        }

        const conversation = await fetchAuthQuery(api.conversations.getConversationById, {
          conversationId: id,
          sessionId,
        });
        if (!conversation) {
          logger.warn("conversation not found", { conversationId: id, requestId });
          return new Response("Conversation not found", { status: 404 });
        }

        const messages = await validateUIMessages({
          messages: [...parseSerializedMessages(conversation.serializedMessages), message],
        });
        logger.info("chat request received", {
          conversationId: id,
          messageCount: messages.length,
          requestId,
        });
        const userMessageWrite = fetchAuthMutation(api.conversations.upsertConversationMessage, {
          conversationId: id,
          messageJson: JSON.stringify(message),
          sessionId,
        });
        // Fired off the critical path; real error handling happens when it's awaited in onFinish.
        userMessageWrite.catch(() => {});
        // `/api/chat` opts into Vercel request cancellation (nitro.config.ts), so a visitor's Stop
        // terminates this function and only work handed to waitUntil survives. Registered before the
        // stream starts, resolved once the turn is saved. The cap stops a stream that never settles
        // from holding the function open.
        let markTurnSaved = () => {};
        const turnSaved = new Promise<void>((resolve) => {
          markTurnSaved = resolve;
        });
        waitUntil(Promise.race([turnSaved, new Promise<void>((resolve) => setTimeout(resolve, 60_000).unref())]));

        const prompt = renderSystemPrompt(systemPrompt, { context: corpus, today: new Date() });
        const modelMessages = messages.slice(-MAX_HISTORY_MESSAGES);

        const result = streamText({
          model: openai("gpt-5.6-luna"),
          system: prompt,
          messages: await convertToModelMessages(modelMessages),
          stopWhen: stepCountIs(3),
          abortSignal: request.signal,
          experimental_transform: stripDashesFromStream,
          onFinish: ({ finishReason, steps, text, toolCalls, usage }) => {
            const hadText = text.length > 0;
            const hadToolCall = toolCalls.length > 0;
            logger.info("chat stream finished", {
              conversationId: id,
              durationMs: Date.now() - startedAt,
              finishReason,
              hadText,
              hadToolCall,
              requestId,
              stepCount: steps.length,
              textLength: text.length,
              toolNames: toolCalls.map((toolCall) => toolCall.toolName),
              usage,
            });
            if (!hadText && !hadToolCall) {
              logger.warn("chat response empty", { conversationId: id, finishReason, requestId, usage });
            }
          },
          // Abuse posture v1: this endpoint is already rate-limited per-IP/per-session
          // (checkChatRateLimit above, plan 002). A dedicated, tighter per-session cap
          // specifically for contact sends is a future tightening, not required for v1.
          tools: buildChatTools({ conversationId: id, postContact: postContactToSlack }),
        });

        logger.info("chat stream started", {
          conversationId: id,
          requestId,
        });

        return result.toUIMessageStreamResponse({
          generateMessageId: generateId,
          onFinish: async ({ isAborted, responseMessage }) => {
            try {
              await userMessageWrite;
              if (!hasRenderableMessageContent(responseMessage)) {
                if (isAborted) {
                  // Undo send: the visitor stopped before any answer, and their question goes back to
                  // the composer. Awaiting the write above first means the delete always lands last.
                  await fetchAuthMutation(api.conversations.deleteConversationMessage, {
                    conversationId: id,
                    sessionId,
                    uiMessageId: message.id,
                  });
                  logger.info("chat stopped before reply, question withdrawn", { conversationId: id, requestId });
                  return;
                }
                logger.warn("chat response empty persisted-skip", { conversationId: id, requestId });
                return;
              }
              // Belt-and-suspenders: the stream transform already strips dashes from what
              // onFinish receives, but sanitize again before persisting so the stored
              // message stays dash-free even if the stream pipeline changes.
              await fetchAuthMutation(api.conversations.upsertConversationMessage, {
                conversationId: id,
                messageJson: JSON.stringify(sanitizeMessageForPersistence(responseMessage)),
                sessionId,
              });
              logger.info("chat response completed", {
                assistantMessageId: responseMessage.id,
                conversationId: id,
                durationMs: Date.now() - startedAt,
                requestId,
              });
            } catch (error) {
              logger.error("chat response persist failed", {
                assistantMessageId: responseMessage.id,
                conversationId: id,
                error,
                requestId,
              });
            } finally {
              markTurnSaved();
            }
          },
          onError: (error) => {
            logger.error("chat stream error", { conversationId: id, error, requestId });
            markTurnSaved();
            return "An error occurred.";
          },
          originalMessages: messages,
        });
      },
    },
  },
});
