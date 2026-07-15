import type { ChatConversationState } from "./chat-types";

import { api } from "../../convex/_generated/api";
import { fetchAuthAction, fetchAuthMutation, fetchAuthQuery } from "./auth-server";
import { HOMEPAGE_INTRO_FALLBACK } from "./chat-intro";
import { createLogger } from "./logger";

const logger = createLogger("conversation.intro");
const FALLBACK_INTRO_TEXT = HOMEPAGE_INTRO_FALLBACK;

function createAssistantMessage(text: string) {
  return {
    id: crypto.randomUUID(),
    parts: [
      {
        type: "text",
        text,
      },
    ],
    role: "assistant" as const,
  };
}

export async function createConversationWithIntro(
  sessionId: string,
  correlationId: string,
): Promise<ChatConversationState> {
  const startedAt = Date.now();
  logger.info("conversation intro started", { correlationId, operation: "create-conversation-with-intro" });

  const conversationId = await fetchAuthMutation(api.conversations.createConversation, { sessionId });
  let introText = FALLBACK_INTRO_TEXT;

  try {
    introText = await fetchAuthAction(api.intro.getCachedIntro, {});
  } catch (error) {
    logger.error("cached intro failed", {
      conversationId,
      correlationId,
      error,
      operation: "create-conversation-with-intro",
    });
  }

  await fetchAuthMutation(api.conversations.upsertConversationMessage, {
    conversationId,
    messageJson: JSON.stringify(createAssistantMessage(introText)),
    sessionId,
  });

  const conversation = await fetchAuthQuery(api.conversations.getConversationById, {
    conversationId,
    sessionId,
  });

  if (!conversation) {
    logger.error("conversation intro failed", {
      conversationId,
      correlationId,
      durationMs: Date.now() - startedAt,
      operation: "create-conversation-with-intro",
      outcome: "not_found_after_create",
    });
    throw new Error("Conversation creation failed");
  }

  logger.info("conversation intro completed", {
    conversationId,
    correlationId,
    durationMs: Date.now() - startedAt,
    operation: "create-conversation-with-intro",
    outcome: "success",
  });

  return conversation;
}
