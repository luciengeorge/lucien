import { createServerFn } from "@tanstack/react-start";

import { api } from "../../../convex/_generated/api";
import { fetchAuthMutation, fetchAuthQuery } from "../auth-server";
import { useConversationSession } from "../conversation-session.server";
import { createLogger } from "../logger";

const logger = createLogger("conversation.get-state");

export const getChatState = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useConversationSession();
  const sessionId = session.data.sessionId ?? crypto.randomUUID();
  let conversationId = session.data.conversationId;

  if (!session.data.sessionId) {
    await session.update({
      ...session.data,
      sessionId,
    });
  }

  if (conversationId) {
    const existingConversation = await fetchAuthQuery(api.conversations.getConversationById, {
      conversationId,
    });

    if (existingConversation) {
      logger.info("conversation resumed", {
        conversationId,
        messageCount: existingConversation.messages.length,
      });
      return existingConversation;
    }
  }

  conversationId = await fetchAuthMutation(api.conversations.createConversation, { sessionId });
  await session.update({
    ...session.data,
    conversationId,
    sessionId,
  });

  const conversation = await fetchAuthQuery(api.conversations.getConversationById, {
    conversationId,
  });

  logger.info("conversation created", {
    conversationId,
    sessionId,
  });

  if (!conversation) {
    throw new Error("Conversation initialization failed");
  }

  return conversation;
});
