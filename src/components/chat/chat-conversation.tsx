import type { ChatConversationState } from "#/lib/chat-types";

import { AnalyticsEvent, useAnalytics } from "#/lib/analytics";
import { parseSerializedMessages } from "#/lib/chat-types";
import { startNewConversation } from "#/lib/functions/start-new-conversation";
import { useChat } from "@ai-sdk/react";
import { useMutation } from "@tanstack/react-query";
import { DefaultChatTransport } from "ai";
import { startTransition, useEffect, useMemo, useRef } from "react";
import { StickToBottom, useStickToBottom } from "use-stick-to-bottom";

import { ChatComposerBlock } from "./chat-composer-block";
import { ChatIntroPlaceholder } from "./chat-intro-placeholder";
import { ChatNewConversationButton } from "./chat-new-conversation-button";
import { ChatPendingReply } from "./chat-pending-reply";
import { ChatScrollToBottomButton } from "./chat-scroll-to-bottom-button";
import { ChatStarterPrompts } from "./chat-starter-prompts";
import { ChatTimelineMessage } from "./chat-timeline-message";
import { INTRO_PROMPT } from "./chat.constants";
import { isBootstrapMessage } from "./chat.utils";

export function ChatConversation({
  chatState,
  onConversationChange,
}: {
  chatState: ChatConversationState;
  onConversationChange: (state: ChatConversationState) => void;
}) {
  const { capture } = useAnalytics();
  const bootstrappedConversationIdRef = useRef<string | null>(null);
  const lastCompletedMessageIdRef = useRef<string | null>(null);
  const initialMessages = useMemo(
    () => parseSerializedMessages(chatState.serializedMessages),
    [chatState.serializedMessages],
  );
  const stickToBottom = useStickToBottom({
    initial: "instant",
    resize: "smooth",
  });
  const startConversationMutation = useMutation({
    mutationFn: startNewConversation,
    onSuccess(nextConversation) {
      startTransition(() => {
        onConversationChange(nextConversation);
      });

      requestAnimationFrame(() => {
        void stickToBottom.scrollToBottom("auto");
      });
    },
  });
  const { isPending: isStartingNewConversation, mutateAsync: startConversation } = startConversationMutation;

  const { messages, sendMessage, status } = useChat({
    id: chatState.conversation?.id ?? "new-conversation",
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ id, messages }) => ({
        body: {
          id,
          message: messages[messages.length - 1],
        },
      }),
    }),
  });

  useEffect(() => {
    if (chatState.serializedMessages.length > 0 || messages.length > 0) return;

    if (!chatState.conversation) {
      if (isStartingNewConversation) return;

      void startConversation({});
      return;
    }

    if (bootstrappedConversationIdRef.current === chatState.conversation.id) return;

    bootstrappedConversationIdRef.current = chatState.conversation.id;
    capture(AnalyticsEvent.chatBootstrapRequested, {
      source: "bootstrap",
    });
    void sendMessage({ text: INTRO_PROMPT });
  }, [
    capture,
      chatState.conversation,
      chatState.serializedMessages.length,
      isStartingNewConversation,
      messages.length,
      onConversationChange,
      sendMessage,
      startConversation,
    ]);

  const visibleMessages = useMemo(() => messages.filter((message) => !isBootstrapMessage(message)), [messages]);
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
  }, [capture, status, visibleMessages]);

  const handleSend = async (message: string) => {
    capture(AnalyticsEvent.chatMessageSubmitted, {
      message_length: message.length,
      source: "composer",
    });
    void stickToBottom.scrollToBottom({ animation: "smooth" });
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
    void stickToBottom.scrollToBottom({ animation: "smooth" });
    await sendMessage({ text: prompt });
  };

  const handleNewConversation = async () => {
    if (isStartingNewConversation) return;
    capture(AnalyticsEvent.newConversationClicked, {
      source: "cta",
    });

    await startConversation({});
  };

  const isBusy = status === "submitted" || status === "streaming" || !chatState.conversation;

  return (
    <section className="flex min-h-0 grow overflow-hidden bg-background">
      <div className="flex min-h-0 w-full grow flex-col gap-2 sm:gap-5">
        <ChatNewConversationButton
          isDisabled={isStartingNewConversation}
          onClick={() => void handleNewConversation()}
        />

        <StickToBottom instance={stickToBottom} className="relative min-h-0 grow">
          <StickToBottom.Content className="mx-auto w-full max-w-3xl px-4 pb-20 sm:px-6 sm:pb-24">
            <ol className="space-y-0">
              {showIntroPlaceholder ? <ChatIntroPlaceholder /> : null}
              {visibleMessages.map((message, index) => (
                <ChatTimelineMessage key={message.id} isFirst={index === 0} message={message} status={status} />
              ))}
              {showPendingReply ? <ChatPendingReply isFirst={visibleMessages.length === 0} /> : null}
            </ol>
          </StickToBottom.Content>
        </StickToBottom>

        {showStarterPrompts ? (
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
            <ChatStarterPrompts onStarterPrompt={handleStarterPrompt} />
          </div>
        ) : null}

        <div className="sticky bottom-0 z-10">
          <div className="relative mx-auto w-full max-w-3xl px-4 sm:px-6">
            {!stickToBottom.isAtBottom ? (
              <ChatScrollToBottomButton
                onClick={() => {
                  void stickToBottom.scrollToBottom({ animation: "smooth" });
                }}
              />
            ) : null}
            <div className="bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/75">
              <ChatComposerBlock isBusy={isBusy} onSend={handleSend} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
