import type { ChatConversationState } from "#/lib/chat-types";

import { ChatPage } from "#/components/chat/chat-page";
import { fetchHomepageIntro } from "#/lib/homepage-intro";
import { SITE_URL } from "#/lib/site-config";
import { createFileRoute } from "@tanstack/react-router";

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

  return (
    <>
      <h1 className="sr-only">Lucien George, Senior Product Engineer at Fyxer</h1>
      <ChatPage initialChatState={initialChatState} />
    </>
  );
}
