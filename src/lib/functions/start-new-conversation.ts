import { createServerFn } from "@tanstack/react-start";

import type { ChatConversationState } from "../chat-types";

import { createConversationWithIntro } from "../conversation-intro.server";
import { getConversationSession } from "../conversation-session.server";
import { createLogger } from "../logger";

const logger = createLogger("conversation.start-new");

export const startNewConversation = createServerFn({ method: "POST" }).handler(
  async (): Promise<ChatConversationState> => {
    const session = await getConversationSession();
    const sessionId = session.data.sessionId ?? crypto.randomUUID();
    const conversation = await createConversationWithIntro(sessionId);
    await session.update({
      ...session.data,
      conversationId: conversation.conversation?.id,
      sessionId,
    });

    logger.info("new conversation started", {
      conversationId: conversation.conversation?.id,
      sessionId,
    });

    return conversation;
  },
);
