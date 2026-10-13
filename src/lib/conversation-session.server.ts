import { getCookieSession } from "./cookie-session.server";

const CONVERSATION_COOKIE = "lucien-conversation";

interface ConversationSessionData {
  conversationId?: string;
  sessionId?: string;
}

export function getConversationSession() {
  return getCookieSession<ConversationSessionData>(CONVERSATION_COOKIE);
}
