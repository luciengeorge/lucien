import type { ChatConversationState } from "#/lib/chat-types";

import { ChatPage } from "#/components/chat/chat-page";
import { HOMEPAGE_FALLBACK_HTML } from "#/lib/content/homepage-fallback";
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

  /*
   * A visible identity, not the sr-only stand-in #56 added. The page opened
   * on a wall of assistant prose with no name, no role and nothing saying
   * what the box at the bottom was for. This sits in space the transcript
   * was already leaving empty, so it costs no scroll.
   *
   * A div rather than a <header>: an extractor looking for the main content of
   * a page drops header, nav, and footer elements wherever they sit, and the
   * only h1 on the homepage was inside one. An audit read the document as
   * having no heading at all while the same document reported h1=1 to a
   * checker counting tags.
   */
  return (
    <>
      <div className="mx-auto w-full max-w-3xl shrink-0 px-4 pb-3 sm:px-6 sm:pb-4">
        <h1 className="text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">Lucien George</h1>
        <p className="mt-1 text-sm text-neutral-600 sm:text-base">
          Senior Product Engineer at Fyxer. Ask this page anything about his work.
        </p>
      </div>
      <noscript>
        <div
          className="mx-auto prose max-w-3xl overflow-y-auto px-4 pb-10 prose-neutral sm:px-6"
          dangerouslySetInnerHTML={{ __html: HOMEPAGE_FALLBACK_HTML }}
        />
      </noscript>
      <ChatPage initialChatState={initialChatState} />
    </>
  );
}
