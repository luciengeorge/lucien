import type { ChatConversationState } from "#/lib/chat-types";

import { AnalyticsEvent, useAnalytics } from "#/lib/analytics";
import { useEffect, useState } from "react";

import { ChatConversation } from "./chat-conversation";

export function ChatPage({ initialChatState }: { initialChatState: ChatConversationState }) {
  const [chatState, setChatState] = useState(initialChatState);
  // Remount only to start over. The first conversation is created under a live
  // composer, and remounting then would throw away what the visitor typed.
  const [mountKey, setMountKey] = useState(initialChatState.conversation?.id ?? "new-conversation");
  const { capture } = useAnalytics();

  const handleConversationChange = (nextChatState: ChatConversationState) => {
    if (chatState.conversation) setMountKey(nextChatState.conversation?.id ?? "new-conversation");
    setChatState(nextChatState);
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

  return <ChatConversation key={mountKey} chatState={chatState} onConversationChange={handleConversationChange} />;
}
