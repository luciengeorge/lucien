import { createServerFn } from "@tanstack/react-start";

import { api } from "../../../convex/_generated/api";
import { fetchAuthMutation, fetchAuthQuery } from "../auth-server";
import { getConversationSession } from "../conversation-session.server";
import { createLogger } from "../logger";

const logger = createLogger("conversation.start-new");

export const startNewConversation = createServerFn({ method: "POST" }).handler(async () => {
    const session = await getConversationSession();
  const sessionId = session.data.sessionId ?? crypto.randomUUID();
  const conversationId = await fetchAuthMutation(api.conversations.createConversation, { sessionId });
  await session.update({
    ...session.data,
    conversationId,
    sessionId,
  });

    const conversation = await fetchAuthQuery(api.conversations.getConversationById, {
      conversationId,
      sessionId,
    });

  logger.info("new conversation started", {
    conversationId,
    sessionId,
  });

  if (!conversation) {
    throw new Error("Conversation creation failed");
  }

  return conversation;
});
