import type { ChatConversationState } from "#/lib/chat-types";

import { AsideNote, AsideVoice, CedarPage, PageHeader } from "#/components/cedar/cedar-page";
import { AnalyticsEvent, useAnalytics } from "#/lib/analytics";
import { parseSerializedMessages } from "#/lib/chat-types";
import { startNewConversation } from "#/lib/functions/start-new-conversation";
import { useChat } from "@ai-sdk/react";
import { useMutation } from "@tanstack/react-query";
import { DefaultChatTransport } from "ai";
import { useReducedMotion } from "motion/react";
import { startTransition, useEffect, useMemo, useRef } from "react";

import { ChatComposerBlock } from "./chat-composer-block";
import { ChatIntroPlaceholder } from "./chat-intro-placeholder";
import { ChatNewConversationBar } from "./chat-new-conversation-bar";
import { ChatPendingReply } from "./chat-pending-reply";
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

  // The transcript flows in the document rather than in a scroll pane, so the
  // page owns the scroll: each new question is walked up to the top of the
  // viewport, leaving the reply room to arrive underneath it.
  const shouldReduceMotion = useReducedMotion();
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const lastScrolledUserMessageIdRef = useRef<string | null>(null);
  useEffect(() => {
    const lastMessage = visibleMessages.at(-1);
    if (!lastMessage || lastMessage.role !== "user") return;
    if (lastScrolledUserMessageIdRef.current === lastMessage.id) return;
    lastScrolledUserMessageIdRef.current = lastMessage.id;

    transcriptRef.current
      ?.querySelector(`[data-message-id="${lastMessage.id}"]`)
      ?.scrollIntoView({ behavior: shouldReduceMotion ? "auto" : "smooth", block: "start" });
  }, [shouldReduceMotion, visibleMessages]);

  const isBusy = status === "submitted" || status === "streaming" || !chatState.conversation;

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
    <CedarPage
      aside={
        <>
          <AsideVoice>He answers in his own voice, from his own notes. Ask him anything.</AsideVoice>
          <AsideNote label="LIVES IN">Beirut, then Montreal, then London since 2018.</AsideNote>
          <AsideNote label="BUILDS WITH">TypeScript, React, Convex. Ships whole, never partial.</AsideNote>
        </>
      }
    >
      <PageHeader leadIn="made in" title="the Levant">
        <p className="mt-2 font-sans text-lg text-ink-soft">Lucien George, product engineer in London.</p>
      </PageHeader>

      <div ref={transcriptRef} className="flex flex-col border-t rule-stone">
        {showIntroPlaceholder ? <ChatIntroPlaceholder /> : null}
        {visibleMessages.map((message, index) => (
          <div key={message.id} className={entryItemClassName(index === 0)} data-message-id={message.id}>
            <ChatTimelineMessage isActive={index === visibleMessages.length - 1} message={message} status={status} />
          </div>
        ))}
        {showPendingReply ? <ChatPendingReply isFirst={visibleMessages.length === 0} /> : null}
      </div>

      <div className="sticky bottom-0 z-10 flex flex-col gap-3 bg-limestone pb-4">
        <ChatNewConversationBar isDisabled={isStartingNewConversation} onClick={() => void handleNewConversation()} />
        <ChatComposerBlock isBusy={isBusy} onResumeRequest={handleResumeRequest} onSend={handleSend} />
      </div>

      {showStarterPrompts ? <ChatStarterPrompts onStarterPrompt={handleStarterPrompt} /> : null}
    </CedarPage>
  );
}
