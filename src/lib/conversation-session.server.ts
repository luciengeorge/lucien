import { useSession } from "@tanstack/react-start/server";

const CONVERSATION_COOKIE = "lucien-conversation";

interface ConversationSessionData {
  conversationId?: string;
  sessionId?: string;
}

function getConversationSessionPassword() {
  const password = process.env.TOAST_SECRET;
  if (!password) {
    throw new Error("TOAST_SECRET must be set");
  }

  return password;
}

export function useConversationSession() {
  return useSession<ConversationSessionData>({
    name: CONVERSATION_COOKIE,
    password: getConversationSessionPassword(),
    cookie: {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  });
}
