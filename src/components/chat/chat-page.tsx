import type { ChatConversationState } from "#/lib/chat-types";

import { AnalyticsEvent, useAnalytics } from "#/lib/analytics";
import { useEffect, useState } from "react";

import { ChatConversation } from "./chat-conversation";

export function ChatPage({ initialChatState }: { initialChatState: ChatConversationState }) {
  const [chatState, setChatState] = useState(initialChatState);
  const { capture } = useAnalytics();

  useEffect(() => {
    capture(AnalyticsEvent.portfolioViewed, {
      entrypoint: "homepage",
    });

    if (initialChatState.conversation && initialChatState.serializedMessages.length > 0) {
      capture(AnalyticsEvent.conversationResumed, {
        message_count: initialChatState.serializedMessages.length,
      });
    }
  }, [capture, initialChatState.conversation, initialChatState.serializedMessages.length]);

  return (
    <ChatConversation
      key={chatState.conversation?.id ?? "new-conversation"}
      chatState={chatState}
      onConversationChange={setChatState}
    />
  );
}
