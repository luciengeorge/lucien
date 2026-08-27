import type { ChatConversationState } from "#/lib/chat-types";

import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "#/components/ui/message-scroller";
import { AnalyticsEvent, useAnalytics } from "#/lib/analytics";
import { parseSerializedMessages } from "#/lib/chat-types";
import { startNewConversation } from "#/lib/functions/start-new-conversation";
import { useChat } from "@ai-sdk/react";
import { useMutation } from "@tanstack/react-query";
import { DefaultChatTransport } from "ai";
import { startTransition, useEffect, useMemo, useRef } from "react";

import { ChatComposerBlock } from "./chat-composer-block";
import { ChatIntroPlaceholder } from "./chat-intro-placeholder";
import { ChatNewConversationBar } from "./chat-new-conversation-bar";
import { ChatPendingReply } from "./chat-pending-reply";
import { transcriptScrollBehaviour } from "./chat-scroll-position";
import { ChatStarterPrompts } from "./chat-starter-prompts";
import { ChatTimelineMessage } from "./chat-timeline-message";
import { createRateLimitAwareFetch, entryItemClassName, getSettledAssistantAnalyticsEvents } from "./chat.utils";

export function ChatConversation({
  chatState,
  onConversationChange,
}: {
  chatState: ChatConversationState;
  onConversationChange: (state: ChatConversationState) => void;
}) {
  const { capture } = useAnalytics();
  const lastCompletedMessageIdRef = useRef<string | null>(null);
  const initialMessages = useMemo(
    () => parseSerializedMessages(chatState.serializedMessages),
    [chatState.serializedMessages],
  );
  const startConversationMutation = useMutation({
    mutationFn: startNewConversation,
    onSuccess(nextConversation) {
      startTransition(() => {
        onConversationChange(nextConversation);
      });
    },
  });
  const { isPending: isStartingNewConversation, mutateAsync: startConversation } = startConversationMutation;

  // The homepage renders a static, edge-cached shell with no conversation.
  // Create one (which sets the session cookie on its own request) as soon as we
  // mount without one, so a conversation exists before the first send without
  // making the document itself per-session / uncacheable.
  const conversationCreationStartedRef = useRef(false);
  useEffect(() => {
    if (chatState.conversation || conversationCreationStartedRef.current) return;
    conversationCreationStartedRef.current = true;
    void startConversation({});
  }, [chatState.conversation, startConversation]);

  const { messages, sendMessage, status } = useChat({
    id: chatState.conversation?.id ?? "new-conversation",
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      fetch: createRateLimitAwareFetch(fetch, () => capture(AnalyticsEvent.chatRateLimited)),
      prepareSendMessagesRequest: ({ id, messages }) => ({
        body: {
          id,
          message: messages[messages.length - 1],
        },
      }),
    }),
  });

  const visibleMessages = messages;
  const hasVisibleUserMessage = visibleMessages.some((message) => message.role === "user");
  const showIntroPlaceholder = visibleMessages.length === 0;
  const showStarterPrompts = !hasVisibleUserMessage && !showIntroPlaceholder;
  const showPendingReply =
    !showIntroPlaceholder && status !== "ready" && status !== "error" && visibleMessages.at(-1)?.role === "user";

  useEffect(() => {
    if (status === "error") {
      capture(AnalyticsEvent.chatResponseFailed, {
        visible_message_count: visibleMessages.length,
      });
      return;
    }

    if (status !== "ready") return;

    const lastAssistantMessage = [...visibleMessages].reverse().find((message) => message.role === "assistant");
    if (!lastAssistantMessage || lastAssistantMessage.id === lastCompletedMessageIdRef.current) return;

    lastCompletedMessageIdRef.current = lastAssistantMessage.id;

    const responseTextLength = lastAssistantMessage.parts.reduce((total, part) => {
      if (part.type !== "text") return total;
      return total + part.text.length;
    }, 0);

    capture(AnalyticsEvent.chatResponseCompleted, {
      response_length: responseTextLength,
      visible_message_count: visibleMessages.length,
    });

    for (const { event, properties } of getSettledAssistantAnalyticsEvents(lastAssistantMessage.parts)) {
      capture(event, properties);
    }
  }, [capture, status, visibleMessages]);

  /*
    Two different reasons the composer cannot send, and they need different
    treatment. Before the conversation exists there is nowhere to send, so the
    input is genuinely unusable. While a reply streams the input is perfectly
    usable - you just cannot send a second message yet - so disabling it there
    only served to blur it and throw away your place.
  */
  const isReady = Boolean(chatState.conversation);
  const isStreaming = status === "submitted" || status === "streaming";
  const isBusy = isStreaming || !isReady;

  const handleSend = async (message: string) => {
    capture(AnalyticsEvent.chatMessageSubmitted, {
      message_length: message.length,
      source: "composer",
    });
    await sendMessage({ text: message });
  };

  const handleStarterPrompt = async (prompt: string) => {
    capture(AnalyticsEvent.starterPromptClicked, {
      prompt,
    });
    capture(AnalyticsEvent.chatMessageSubmitted, {
      message_length: prompt.length,
      source: "starter_prompt",
    });
    await sendMessage({ text: prompt });
  };

  const handleResumeRequest = () => {
    if (isBusy) return;
    const prompt = "Can I see Lucien's resume?";
    capture(AnalyticsEvent.resumeRequested, { source: "composer_chip" });
    capture(AnalyticsEvent.chatMessageSubmitted, {
      message_length: prompt.length,
      source: "resume_chip",
    });
    void sendMessage({ text: prompt });
  };

  const handleNewConversation = async () => {
    if (isStartingNewConversation) return;
    capture(AnalyticsEvent.newConversationClicked, {
      source: "cta",
    });

    await startConversation({});
  };

  return (
    <section aria-label="Conversation with Poof" className="flex min-h-0 grow overflow-hidden bg-background">
      <div className="flex min-h-0 w-full grow flex-col gap-2 sm:gap-5">
        <ChatNewConversationBar isDisabled={isStartingNewConversation} onClick={() => void handleNewConversation()} />

        <MessageScrollerProvider
          key={chatState.conversation?.id ?? "new-conversation"}
          {...transcriptScrollBehaviour(visibleMessages)}
        >
          <MessageScroller className="min-h-0 grow">
            <MessageScrollerViewport>
              <MessageScrollerContent className="mx-auto w-full max-w-3xl gap-0 px-4 pb-20 sm:px-6 sm:pb-24">
                {showIntroPlaceholder ? <ChatIntroPlaceholder /> : null}
                {visibleMessages.map((message, index) => (
                  <MessageScrollerItem
                    key={message.id}
                    messageId={message.id}
                    scrollAnchor={message.role === "user"}
                    className={entryItemClassName(index === 0)}
                  >
                    <ChatTimelineMessage
                      isActive={index === visibleMessages.length - 1}
                      message={message}
                      status={status}
                    />
                  </MessageScrollerItem>
                ))}
                {showPendingReply ? <ChatPendingReply isFirst={visibleMessages.length === 0} /> : null}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        </MessageScrollerProvider>

        {showStarterPrompts ? (
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
            <ChatStarterPrompts onStarterPrompt={handleStarterPrompt} />
          </div>
        ) : null}

        <div className="sticky bottom-0 z-10">
          <div className="relative mx-auto w-full max-w-3xl px-4 sm:px-6">
            <div className="bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/75">
              <ChatComposerBlock
                isReady={isReady}
                isStreaming={isStreaming}
                onResumeRequest={handleResumeRequest}
                onSend={handleSend}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
