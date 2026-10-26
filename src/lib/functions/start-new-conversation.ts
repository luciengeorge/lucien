import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

import type { ChatConversationState } from "../chat-types";

import { api } from "../../../convex/_generated/api";
import { fetchAuthQuery } from "../auth-server";
import { ConversationIdSchema } from "../chat-types";
import { createConversationWithIntro } from "../conversation-intro.server";
import { getConversationSession } from "../conversation-session.server";
import { getOrCreateCorrelationId } from "../correlation-id";
import { createLogger } from "../logger";
import { voiceRestingForPage } from "../voice/voice-resting.server";

const logger = createLogger("conversation.start-new");

// Server-only: the client bundle imports this module for its server functions, and this would drag
// the `.server` imports in with it.
export const startConversation = createServerOnlyFn(async (correlationId: string): Promise<ChatConversationState> => {
  const session = await getConversationSession();
  const sessionId = session.data.sessionId ?? crypto.randomUUID();
  const conversation = await createConversationWithIntro(sessionId, correlationId);
  await session.update({
    ...session.data,
    conversationId: conversation.conversation?.id,
    sessionId,
  });

  logger.info("new conversation started", {
    conversationId: conversation.conversation?.id,
    correlationId,
    operation: "start-new-conversation",
    outcome: "success",
    sessionId,
  });

  return conversation;
});

export const startNewConversation = createServerFn({ method: "POST" }).handler(
  async (): Promise<ChatConversationState> => {
    const correlationId = getOrCreateCorrelationId(getRequestHeader("x-vercel-id"));
    logger.info("start new conversation received", { correlationId, operation: "start-new-conversation" });
    return { ...(await startConversation(correlationId)), voiceResting: await voiceRestingForPage() };
  },
);

/** The homepage is one cached document for everyone, so the visitor's own conversation is fetched after mount. */
export const resumeOrStartConversation = createServerFn({ method: "POST" }).handler(
  async (): Promise<ChatConversationState> => {
    const correlationId = getOrCreateCorrelationId(getRequestHeader("x-vercel-id"));
    const session = await getConversationSession();
    const conversationId = ConversationIdSchema.safeParse(session.data.conversationId);
    const { sessionId } = session.data;

    if (conversationId.success && sessionId) {
      try {
        const existing = await fetchAuthQuery(api.conversations.getConversationById, {
          conversationId: conversationId.data,
          sessionId,
        });
        if (existing) {
          logger.info("conversation resumed", { conversationId: conversationId.data, correlationId, sessionId });
          return { ...existing, voiceResting: await voiceRestingForPage() };
        }
      } catch (error) {
        logger.warn("conversation resume failed", { correlationId, error, sessionId });
      }
    }

    return { ...(await startConversation(correlationId)), voiceResting: await voiceRestingForPage() };
  },
);
