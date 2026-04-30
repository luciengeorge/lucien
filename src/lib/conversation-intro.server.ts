import type { ChatConversationState } from "./chat-types";

import { api } from "../../convex/_generated/api";
import { fetchAuthAction, fetchAuthMutation, fetchAuthQuery } from "./auth-server";
import { createLogger } from "./logger";

const logger = createLogger("conversation.intro");
const FALLBACK_INTRO_TEXT =
  "I'm Poof, Lucien George's AI portfolio assistant. I can help you explore Lucien's work, background, projects, and interests. Lucien is a product engineer focused on thoughtful, high-leverage software, currently building at Fyxer and shaped by a mix of startup, product, and engineering experience. Ask me about his current work, past projects, technical taste, or personal background.";

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
