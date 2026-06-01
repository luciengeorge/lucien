import type { ChatConversationState } from "#/lib/chat-types";

import { ChatBootstrap } from "#/components/chat/chat-bootstrap";
import { ChatPage } from "#/components/chat/chat-page";
import { ensureChatConversation, getChatIntro } from "#/lib/functions/get-chat-state";
import { Await, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  loader: async () => {
    const base = await ensureChatConversation();

    if (base.kind === "resumed") {
      return { deferredState: undefined, state: base.state };
    }

    const state: ChatConversationState = { conversation: base.conversation, serializedMessages: [] };

    // Not awaited: streamed to the client so the intro generation never blocks
    // first paint / TTFB.
    const deferredState = getChatIntro({
      data: { conversationId: base.conversation.id, sessionId: base.sessionId },
    });

    return { deferredState, state };
  },
  component: HomePage,
});

function HomePage() {
  const { deferredState, state } = Route.useLoaderData();

  if (!deferredState) {
    return <ChatPage initialChatState={state} />;
  }

  return (
    <Await fallback={<ChatBootstrap />} promise={deferredState}>
      {(resolvedState) => <ChatPage initialChatState={resolvedState} />}
    </Await>
  );
}
