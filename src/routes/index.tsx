import type { ChatConversationState } from "#/lib/chat-types";

import { ChatPage } from "#/components/chat/chat-page";
import { fetchHomepageIntro } from "#/lib/homepage-intro";
import { createFileRoute } from "@tanstack/react-router";

const SITE_URL = "https://www.luciengeorge.com";

// The homepage stays edge-cacheable: the loader fetches the (global) cached LLM
// intro with a cookie-free Convex client, so the rendered document is identical
// for every visitor and carries no Set-Cookie. The intro is baked into the
// first paint (no fallback->LLM swap); the conversation is still created
// client-side on mount (see ChatConversation), which returns the same intro.
export const Route = createFileRoute("/")({
  loader: async () => {
    const introText = await fetchHomepageIntro();
    const introMessage = {
      id: "intro",
      parts: [{ text: introText, type: "text" }],
      role: "assistant" as const,
    };
    const initialChatState: ChatConversationState = {
      conversation: null,
      serializedMessages: [JSON.stringify(introMessage)],
    };

    return { initialChatState };
  },
  component: HomePage,
  head: () => ({
    links: [{ rel: "canonical", href: SITE_URL }],
  }),
});

function HomePage() {
  const { initialChatState } = Route.useLoaderData();

  return <ChatPage initialChatState={initialChatState} />;
}
