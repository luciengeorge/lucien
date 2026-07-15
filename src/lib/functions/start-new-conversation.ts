import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

import type { ChatConversationState } from "../chat-types";

import { createConversationWithIntro } from "../conversation-intro.server";
import { getConversationSession } from "../conversation-session.server";
import { getOrCreateCorrelationId } from "../correlation-id";
import { createLogger } from "../logger";

const logger = createLogger("conversation.start-new");

export const startNewConversation = createServerFn({ method: "POST" }).handler(
  async (): Promise<ChatConversationState> => {
    const correlationId = getOrCreateCorrelationId(getRequestHeader("x-vercel-id"));
    logger.info("start new conversation received", { correlationId, operation: "start-new-conversation" });

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
  },
);
