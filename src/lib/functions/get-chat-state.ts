import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { Id } from "../../../convex/_generated/dataModel";

import { api } from "../../../convex/_generated/api";
import { fetchAuthQuery } from "../auth-server";
import { getConversationSession } from "../conversation-session.server";
import type { ChatConversationState } from "../chat-types";
import { createLogger } from "../logger";

const logger = createLogger("conversation.get-state");
const ConversationIdSchema = z.custom<Id<"conversations">>((value) => typeof value === "string" && value.length > 0);

export const getChatState = createServerFn({ method: "GET" }).handler(async (): Promise<ChatConversationState> => {
  const session = await getConversationSession();
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
      conversationId: ConversationIdSchema.parse(conversationId),
      sessionId,
    });

    if (existingConversation) {
      logger.info("conversation resumed", {
        conversationId,
        messageCount: existingConversation.serializedMessages.length,
      });
      return existingConversation;
    }
  }

  return {
    conversation: null,
    serializedMessages: [],
  } satisfies ChatConversationState;
});
