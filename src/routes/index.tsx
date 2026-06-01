import type { ChatConversationState } from "#/lib/chat-types";

import { ChatPage } from "#/components/chat/chat-page";
import { HOMEPAGE_INTRO_FALLBACK } from "#/lib/chat-intro";
import { createFileRoute } from "@tanstack/react-router";

// The homepage is intentionally static (no loader / no per-session SSR work)
// so the document can be cached at the edge. The conversation is created
// client-side on mount (see ChatConversation), which sets the session cookie
// on a separate request rather than tainting this cacheable document.
const INTRO_MESSAGE = {
  id: "intro",
  parts: [{ text: HOMEPAGE_INTRO_FALLBACK, type: "text" }],
  role: "assistant" as const,
};

const INITIAL_CHAT_STATE: ChatConversationState = {
  conversation: null,
  serializedMessages: [JSON.stringify(INTRO_MESSAGE)],
};

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return <ChatPage initialChatState={INITIAL_CHAT_STATE} />;
}
