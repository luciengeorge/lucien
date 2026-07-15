import type { TextStreamPart, ToolSet, UIMessage } from "ai";

import { fetchAuthAction, fetchAuthMutation, fetchAuthQuery } from "#/lib/auth-server";
import {
  ChatRequestSchema,
  getTextFromMessage,
  hasRenderableMessageContent,
  MAX_HISTORY_MESSAGES,
  parseSerializedMessages,
} from "#/lib/chat-types";
import { getConversationSession } from "#/lib/conversation-session.server";
import { buildLinkWorkEntryOutput, WORK_ENTRY_SLUGS } from "#/lib/link-work-entry";
import { createLogger } from "#/lib/logger";
import { postContactToSlack } from "#/lib/notify-slack";
import { stripDashes } from "#/lib/strip-dashes";
import { openai } from "@ai-sdk/openai";
import { createFileRoute, notFound } from "@tanstack/react-router";
import {
  convertToModelMessages,
  generateId,
  generateText,
  stepCountIs,
  streamText,
  tool,
  validateUIMessages,
} from "ai";
import { z } from "zod";

import systemPrompt from "../../../../content/system-prompt.md?raw";
import { api } from "../../../../convex/_generated/api";

const logger = createLogger("chat.api");

const QUERY_EXPANSION_PROMPT = `Rewrite the user's question into a better search query for finding relevant information about Lucien George's portfolio, career, projects, and personal life. Add context and relevant keywords. Return ONLY the rewritten query, nothing else.

Examples:
- "what do you do?" → "Lucien George current role job position software engineer work"
- "where does he work now?" → "Lucien George current company current role Fyxer Senior Product Engineer notetaker product"
- "what's his github?" → "Lucien George GitHub LinkedIn Twitter X Instagram social links profiles"
- "tell me about yourself" → "Lucien George bio background personal story origin education career"
- "what's your stack?" → "Lucien George tech stack programming languages frameworks tools TypeScript React"
- "any side projects?" → "Lucien George side projects startups co-founder Localista Skyla open source"
- "where did you study?" → "Lucien George education university McGill Le Wagon Harvard degree"`;

/**
 * Rewrites streamed text-delta chunks through stripDashes so the client never sees
 * an em-dash or en-dash, even mid-stream. Non-text chunks pass through unchanged.
 */
function stripDashesFromStream(): TransformStream<TextStreamPart<ToolSet>, TextStreamPart<ToolSet>> {
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

async function expandQuery(query: string): Promise<string> {
  try {
    const { text } = await generateText({
      model: openai("gpt-5.4-nano"),
      system: QUERY_EXPANSION_PROMPT,
      prompt: query,
    });
    return text;
  } catch (error) {
    logger.warn("query expansion failed", { error, queryLength: query.length });
    return query;
  }
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
        if (!sessionId || conversationSession.data.conversationId !== id) {
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

        const query = getTextFromMessage(message);
        const [conversation, expandedQuery] = await Promise.all([
          fetchAuthQuery(api.conversations.getConversationById, { conversationId: id, sessionId }),
          expandQuery(query),
        ]);
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
        logger.info("chat query expanded", {
          expandedQueryLength: expandedQuery.length,
          queryLength: query.length,
          requestId,
        });

        let context = "";
        try {
          context = await fetchAuthAction(api.search.searchContext, { query: expandedQuery });
        } catch (e) {
          logger.error("rag search failed", { error: e, requestId });
        }

        const userMessageWrite = fetchAuthMutation(api.conversations.upsertConversationMessage, {
          conversationId: id,
          messageJson: JSON.stringify(message),
          sessionId,
        });
        // Fired off the critical path; real error handling happens when it's awaited in onFinish.
        userMessageWrite.catch(() => {});

        const prompt = systemPrompt.replace("{retrieved_context}", context);
        const modelMessages = messages.slice(-MAX_HISTORY_MESSAGES);

        const result = streamText({
          model: openai("gpt-5.4-mini"),
          system: prompt,
          messages: await convertToModelMessages(modelMessages),
          stopWhen: stepCountIs(3),
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
          tools: {
            download_resume: tool({
              description:
                "Provide Lucien's resume as a downloadable PDF. Call this when the user asks for Lucien's resume, CV, or PDF.",
              inputSchema: z.object({}),
              execute: async () => ({
                filename: "lucien-george-resume.pdf",
                url: "/api/resume/pdf",
              }),
            }),
            link_work_entry: tool({
              description:
                "Link to the case study page for one of Lucien's work entries. Call this when pointing the user to more detail on a specific role or project.",
              inputSchema: z.object({ slug: z.enum(WORK_ENTRY_SLUGS) }),
              execute: async ({ slug }) => buildLinkWorkEntryOutput(slug),
            }),
            contact_lucien: tool({
              description:
                "Send a message to Lucien on the visitor's behalf. Call this once the visitor has given a genuine message to send, along with their name and/or contact info if available.",
              inputSchema: z.object({
                contact: z.string().max(200).optional(),
                message: z.string().min(1).max(2000),
                name: z.string().max(120).optional(),
              }),
              execute: async ({ contact, message, name }) => {
                // Abuse posture v1: this endpoint is already rate-limited per-IP/per-session
                // (checkChatRateLimit above, plan 002). A dedicated, tighter per-session cap
                // specifically for contact sends is a future tightening, not required for v1.
                const sent = await postContactToSlack({ contact, conversationId: id, message, name });
                return { status: sent ? "sent" : "failed" };
              },
            }),
          },
        });

        logger.info("chat stream started", {
          conversationId: id,
          contextLength: context.length,
          requestId,
        });

        return result.toUIMessageStreamResponse({
          generateMessageId: generateId,
          onFinish: async ({ responseMessage }) => {
            try {
              await userMessageWrite;
              if (!hasRenderableMessageContent(responseMessage)) {
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
            }
          },
          onError: (error) => {
            logger.error("chat stream error", { conversationId: id, error, requestId });
            return "An error occurred.";
          },
          originalMessages: messages,
        });
      },
    },
  },
});
