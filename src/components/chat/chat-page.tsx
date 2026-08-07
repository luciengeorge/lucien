import type { ChatConversationState } from "#/lib/chat-types";

import { AnalyticsEvent, useAnalytics } from "#/lib/analytics";
import { useEffect, useState } from "react";

import { ChatConversation } from "./chat-conversation";
import { shouldResetConversationView } from "./chat-view-reset";

export function ChatPage({ initialChatState }: { initialChatState: ChatConversationState }) {
  const [chatState, setChatState] = useState(initialChatState);
  const [viewGeneration, setViewGeneration] = useState(0);
  const { capture } = useAnalytics();

  const handleConversationChange = (next: ChatConversationState) => {
    if (shouldResetConversationView(chatState.conversation, next.conversation)) {
      setViewGeneration((generation) => generation + 1);
    }
    setChatState(next);
  };

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
    <ChatConversation key={viewGeneration} chatState={chatState} onConversationChange={handleConversationChange} />
  );
}
