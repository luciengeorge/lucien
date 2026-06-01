import type { Id } from "../../convex/_generated/dataModel";
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

// Generates + persists the intro message for an already-created conversation.
// Split out so the homepage can mint the conversation synchronously (to set the
// session cookie) and stream this comparatively expensive step afterwards.
export async function buildIntroForConversation(
  conversationId: string,
  sessionId: string,
): Promise<{ serializedMessages: string[] }> {
  let introText = FALLBACK_INTRO_TEXT;

  try {
    introText = await fetchAuthAction(api.intro.getCachedIntro, {});
  } catch (error) {
    logger.error("cached intro failed", { conversationId, error });
  }

  const introMessageJson = JSON.stringify(createAssistantMessage(introText));

  await fetchAuthMutation(api.conversations.upsertConversationMessage, {
    conversationId: conversationId as Id<"conversations">,
    messageJson: introMessageJson,
    sessionId,
  });

  return { serializedMessages: [introMessageJson] };
}

export async function createConversationWithIntro(sessionId: string): Promise<ChatConversationState> {
  const conversationId = await fetchAuthMutation(api.conversations.createConversation, { sessionId });
  let introText = FALLBACK_INTRO_TEXT;

  try {
    introText = await fetchAuthAction(api.intro.getCachedIntro, {});
  } catch (error) {
    logger.error("cached intro failed", { conversationId, error });
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
    throw new Error("Conversation creation failed");
  }

  return conversation;
}
