import { ChatPage } from "#/components/chat/chat-page";
import { getChatState } from "#/lib/functions/get-chat-state";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  loader: () => getChatState(),
  component: HomePage,
});

function HomePage() {
  const chatState = Route.useLoaderData();

  return <ChatPage initialChatState={chatState} />;
}
