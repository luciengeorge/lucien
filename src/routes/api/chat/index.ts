import { fetchAuthAction, fetchAuthMutation, fetchAuthQuery } from "#/lib/auth-server";
import { ChatRequestSchema, getTextFromMessage, parseSerializedMessages } from "#/lib/chat-types";
import { getConversationSession } from "#/lib/conversation-session.server";
import { createLogger } from "#/lib/logger";
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
          stopWhen: stepCountIs(3),
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
