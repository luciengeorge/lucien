import type { UIMessage } from "ai";

import { fetchAuthAction, fetchAuthMutation, fetchAuthQuery } from "#/lib/auth-server";
import { getConversationSession } from "#/lib/conversation-session.server";
import { createLogger } from "#/lib/logger";
import { openai } from "@ai-sdk/openai";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, generateId, generateText, streamText, validateUIMessages } from "ai";
import { z } from "zod";

import type { Id } from "../../../../convex/_generated/dataModel";
import systemPrompt from "../../../../content/system-prompt.md?raw";
import { api } from "../../../../convex/_generated/api";

const logger = createLogger("chat.api");

const BasicUIMessageSchema = z.object({
  id: z.string().min(1),
  parts: z.array(z.record(z.string(), z.unknown())),
  role: z.enum(["assistant", "system", "user"]),
});
const ConversationIdSchema = z.custom<Id<"conversations">>((value) => typeof value === "string" && value.length > 0);

const ChatRequestSchema = z.object({
  id: ConversationIdSchema,
  message: z.custom<UIMessage>((value) => BasicUIMessageSchema.safeParse(value).success),
});

function getTextFromMessage(message: UIMessage | undefined) {
  if (!message) return "";

  return message.parts.reduce((text, part) => {
    if (part.type !== "text") {
      return text;
    }

    return `${text} ${part.text}`.trim();
  }, "");
}

const QUERY_EXPANSION_PROMPT = `Rewrite the user's question into a better search query for finding relevant information about Lucien George's portfolio, career, projects, and personal life. Add context and relevant keywords. Return ONLY the rewritten query, nothing else.

Examples:
- "what do you do?" → "Lucien George current role job position software engineer work"
- "where does he work now?" → "Lucien George current company current role Fyxer Senior Product Engineer notetaker product"
- "tell me about yourself" → "Lucien George bio background personal story origin education career"
- "what's your stack?" → "Lucien George tech stack programming languages frameworks tools TypeScript React"
- "any side projects?" → "Lucien George side projects startups co-founder Localista Skyla open source"
- "where did you study?" → "Lucien George education university McGill Le Wagon Harvard degree"`;

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

        const conversation = await fetchAuthQuery(api.conversations.getConversationById, {
          conversationId: id,
          sessionId,
        });
        if (!conversation) {
          logger.warn("conversation not found", { conversationId: id, requestId });
          return new Response("Conversation not found", { status: 404 });
        }

        const messages = await validateUIMessages({
          messages: [...conversation.messages, message],
        });
        logger.info("chat request received", {
          conversationId: id,
          messageCount: messages.length,
          requestId,
        });

        const lastUserMessage = [...messages].reverse().find((candidate) => candidate.role === "user");
        const query = getTextFromMessage(lastUserMessage);

        const expandedQuery = await expandQuery(query);
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

        await fetchAuthMutation(api.conversations.upsertConversationMessage, {
          conversationId: id,
          messageJson: JSON.stringify(message),
          sessionId,
        });

        const prompt = systemPrompt.replace("{retrieved_context}", context);

        const result = streamText({
          model: openai("gpt-5.4-mini"),
          system: prompt,
          messages: await convertToModelMessages(messages),
        });

        logger.info("chat stream started", {
          conversationId: id,
          contextLength: context.length,
          requestId,
        });

        return result.toUIMessageStreamResponse({
          generateMessageId: generateId,
          onFinish: async ({ responseMessage }) => {
            await fetchAuthMutation(api.conversations.upsertConversationMessage, {
              conversationId: id,
              messageJson: JSON.stringify(responseMessage),
              sessionId,
            });
            logger.info("chat response completed", {
              assistantMessageId: responseMessage.id,
              conversationId: id,
              durationMs: Date.now() - startedAt,
              requestId,
            });
          },
          originalMessages: messages,
        });
      },
    },
  },
});
