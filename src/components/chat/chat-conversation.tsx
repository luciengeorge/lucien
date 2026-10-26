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
import { getTextFromMessage, hasRenderableMessageContent, parseSerializedMessages } from "#/lib/chat-types";
import { getConversation } from "#/lib/functions/get-conversation";
import { resumeOrStartConversation, startNewConversation } from "#/lib/functions/start-new-conversation";
import { useChat } from "@ai-sdk/react";
import { useMutation } from "@tanstack/react-query";
import { DefaultChatTransport } from "ai";
import { lazy, startTransition, Suspense, useEffect, useMemo, useRef, useState } from "react";

import type { ChatComposerHandle } from "./chat-composer-block";
import type { EndedCall } from "./chat-voice-call";
import type { VoiceCallStart } from "./chat-voice-start";

import { ChatComposerBlock } from "./chat-composer-block";
import { ChatIdentity } from "./chat-identity";
import { ChatIntroPlaceholder } from "./chat-intro-placeholder";
import { ChatPendingReply } from "./chat-pending-reply";
import { transcriptScrollBehaviour } from "./chat-scroll-position";
import { ChatSendFailed } from "./chat-send-failed";
import { ChatStarterPrompts } from "./chat-starter-prompts";
import { ChatStatusMarker } from "./chat-status-marker";
import { ChatTimelineMessage } from "./chat-timeline-message";
import { ChatVoiceBoundary } from "./chat-voice-boundary";
import {
  ChatVoiceScreen,
  VOICE_PRIVACY_NOTE,
  VOICE_REFUSAL_COPY,
  VoiceBackButton,
  VoiceEndButton,
} from "./chat-voice-screen";
import { isVoiceEnabled, releaseUnusedCall, requestVoiceCall } from "./chat-voice-start";
import { buildVoiceContext, waitForVoiceTranscript } from "./chat-voice.utils";
import { createRateLimitAwareFetch, entryItemClassName, getSettledAssistantAnalyticsEvents } from "./chat.utils";
import { createPoofSignals, PoofSignalsContext } from "./poof-signals";

const loadVoiceCall = () => import("./chat-voice-call");
const ChatVoiceCall = lazy(loadVoiceCall);

export function ChatConversation({
  chatState,
  onConversationChange,
}: {
  chatState: ChatConversationState;
  onConversationChange: (state: ChatConversationState) => void;
}) {
  const { capture } = useAnalytics();
  const [poofSignals] = useState(createPoofSignals);
  // Replies the visitor stopped, by id: they stay marked as stopped and never read as generating again.
  // State, not a ref like `stopRequestedRef` below, because the transcript has to re-render.
  const [stoppedReplyIds, setStoppedReplyIds] = useState<ReadonlySet<string>>(() => new Set());
  const lastCompletedMessageIdRef = useRef<string | null>(null);
  // A stopped reply settles to "ready" like a finished one; this keeps it out of the completion metrics.
  const stopRequestedRef = useRef(false);
  const initialMessages = useMemo(
    () => parseSerializedMessages(chatState.serializedMessages),
    [chatState.serializedMessages],
  );
  const startConversationMutation = useMutation({
    mutationFn: ({ fresh }: { fresh: boolean }) => (fresh ? startNewConversation() : resumeOrStartConversation()),
    onSuccess(nextConversation, { fresh }) {
      // Every new conversation already holds the intro, so only a visitor turn means they are coming back.
      const resumedMessages = fresh ? [] : parseSerializedMessages(nextConversation.serializedMessages);
      if (resumedMessages.some((message) => message.role === "user")) {
        capture(AnalyticsEvent.conversationResumed, { message_count: resumedMessages.length });
      }
      startTransition(() => {
        onConversationChange(nextConversation);
      });
    },
  });
  const {
    isError: hasConversationStartFailed,
    isPending: isStartingNewConversation,
    mutate: startConversation,
  } = startConversationMutation;

  // The homepage renders a static, edge-cached shell with no conversation.
  // Resume the visitor's own (or create one, which sets the session cookie on
  // its own request) as soon as we mount without one, so a conversation exists
  // before the first send without making the document per-session / uncacheable.
  const conversationCreationStartedRef = useRef(false);
  useEffect(() => {
    if (chatState.conversation || conversationCreationStartedRef.current) return;
    conversationCreationStartedRef.current = true;
    startConversation({ fresh: false });
  }, [chatState.conversation, startConversation]);

  const { clearError, messages, regenerate, sendMessage, setMessages, status, stop } = useChat({
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
    // The intro or an earlier reply, when this turn produced no assistant message yet.
    const newReply = lastAssistantMessage?.id === lastCompletedMessageIdRef.current ? undefined : lastAssistantMessage;
    if (newReply) lastCompletedMessageIdRef.current = newReply.id;

    const responseTextLength = (newReply?.parts ?? []).reduce((total, part) => {
      if (part.type !== "text") return total;
      return total + part.text.length;
    }, 0);

    // Checked before the "nothing new" return: a stop while "Thinking…" shows has no reply at all.
    if (stopRequestedRef.current) {
      stopRequestedRef.current = false;
      capture(AnalyticsEvent.chatResponseStopped, {
        response_length: responseTextLength,
        visible_message_count: visibleMessages.length,
      });
      return;
    }

    if (!newReply) return;

    capture(AnalyticsEvent.chatResponseCompleted, {
      response_length: responseTextLength,
      visible_message_count: visibleMessages.length,
    });

    for (const { event, properties } of getSettledAssistantAnalyticsEvents(newReply.parts)) {
      capture(event, properties);
    }
  }, [capture, status, visibleMessages]);

  const isReady = Boolean(chatState.conversation);
  const isStreaming = status === "submitted" || status === "streaming";
  // A message sent before the conversation exists waits here, shown as sent,
  // and goes out once `useChat` is bound to the real conversation id.
  const [queuedMessage, setQueuedMessage] = useState<string | null>(null);
  const isBusy = isStreaming || queuedMessage !== null;

  useEffect(() => {
    if (!isReady || queuedMessage === null) return;
    setQueuedMessage(null);
    void sendMessage({ text: queuedMessage });
  }, [isReady, queuedMessage, sendMessage]);

  const sendOrQueue = async (text: string) => {
    stopRequestedRef.current = false;
    if (!isReady) {
      setQueuedMessage(text);
      return;
    }
    await sendMessage({ text });
  };

  const composerRef = useRef<ChatComposerHandle>(null);

  const handleStop = () => {
    if (queuedMessage !== null) {
      composerRef.current?.restore(queuedMessage);
      setQueuedMessage(null);
      return;
    }
    stopRequestedRef.current = true;
    const last = visibleMessages.at(-1);
    if (last?.role === "assistant") setStoppedReplyIds((ids) => new Set(ids).add(last.id));
    // Stopped before any answer: the visitor most likely sent too early or wants to rephrase, so the
    // question comes back to the composer (undo send). The server withdraws its stored copy too.
    // Same "nothing yet" test as the server, but the server judges later: words written after the click
    // that never reached us make it keep its copy, as when the abort never reaches it at all.
    const question = last?.role === "assistant" ? visibleMessages.at(-2) : last;
    const answered = last?.role === "assistant" && hasRenderableMessageContent(last);
    void Promise.resolve(stop()).then(() => {
      if (answered || question?.role !== "user") return;
      const withdrawn = new Set([question.id, last?.id]);
      setMessages((current) => current.filter((message) => !withdrawn.has(message.id)));
      composerRef.current?.restore(getTextFromMessage(question));
    });
  };

  const handleVoiceLoadFailed = () => {
    if (voiceCall) releaseUnusedCall(voiceCall.call);
    capture(AnalyticsEvent.voiceCallRefused, { reason: "connect_failed" });
  };

  const handleSend = async (message: string) => {
    setIsCallLate(false);
    capture(AnalyticsEvent.chatMessageSubmitted, {
      message_length: message.length,
      source: "composer",
    });
    await sendOrQueue(message);
  };

  const handleStarterPrompt = async (prompt: string) => {
    capture(AnalyticsEvent.starterPromptClicked, {
      prompt,
    });
    capture(AnalyticsEvent.chatMessageSubmitted, {
      message_length: prompt.length,
      source: "starter_prompt",
    });
    await sendOrQueue(prompt);
  };

  const handleResumeRequest = () => {
    if (isBusy) return;
    const prompt = "Can I see Lucien's resume?";
    capture(AnalyticsEvent.resumeRequested, { source: "composer_chip" });
    capture(AnalyticsEvent.chatMessageSubmitted, {
      message_length: prompt.length,
      source: "resume_chip",
    });
    void sendOrQueue(prompt);
  };

  const [voiceCall, setVoiceCall] = useState<{ call: Promise<VoiceCallStart>; context: string | null } | null>(null);
  const [isSavingCall, setIsSavingCall] = useState(false);
  // The webhook outran the wait: the transcript is saved, just not here yet.
  const [isCallLate, setIsCallLate] = useState(false);
  const transcriptWaitRef = useRef<AbortController | null>(null);

  useEffect(() => () => transcriptWaitRef.current?.abort(), []);

  const handleVoiceStart = () => {
    if (isBusy || !isReady || voiceCall) return;
    setIsCallLate(false);
    setVoiceCall({ call: requestVoiceCall(), context: buildVoiceContext(visibleMessages) });
  };

  const handleVoiceEnd = (ended: EndedCall | null) => {
    setVoiceCall(null);
    requestAnimationFrame(() => composerRef.current?.focusVoice());
    if (!ended) return;
    const controller = new AbortController();
    transcriptWaitRef.current = controller;
    setIsSavingCall(true);
    // Read-only, by id: a blip here must never start a new conversation and move the visitor onto it.
    void waitForVoiceTranscript({
      callId: ended.callId,
      fetchConversation: () => getConversation({ data: { conversationId: ended.conversationId } }),
      signal: controller.signal,
    }).then(({ found, state }) => {
      if (controller.signal.aborted) return;
      setIsSavingCall(false);
      setIsCallLate(!found);
      if (!state) return;
      // The call lands in the visitor's session conversation, which another tab may have moved on from.
      if (state.conversation?.id !== chatState.conversation?.id) {
        startTransition(() => {
          onConversationChange(state);
        });
        return;
      }
      setMessages(parseSerializedMessages(state.serializedMessages));
    });
  };

  // Left before the call's code loaded, so the call itself never got the chance to hand its time back.
  const handleVoiceCancel = () => {
    if (voiceCall) releaseUnusedCall(voiceCall.call);
    handleVoiceEnd(null);
  };

  const handleNewConversation = () => {
    if (isStartingNewConversation) return;
    transcriptWaitRef.current?.abort();
    setIsSavingCall(false);
    setIsCallLate(false);
    capture(AnalyticsEvent.newConversationClicked, {
      source: "cta",
    });

    startConversation({ fresh: true });
  };

  return (
    <PoofSignalsContext value={poofSignals}>
      <section aria-label="Conversation with Poof" className="flex min-h-0 grow overflow-hidden bg-background">
        <div className="flex min-h-0 w-full grow flex-col gap-2 sm:gap-5">
          <ChatIdentity
            compact={hasVisibleUserMessage || queuedMessage !== null}
            isStartingNew={isStartingNewConversation}
            onNew={handleNewConversation}
          />

          <MessageScrollerProvider
            key={chatState.conversation?.id ?? "new-conversation"}
            {...transcriptScrollBehaviour(visibleMessages)}
          >
            <MessageScroller className="min-h-0 grow">
              <MessageScrollerViewport>
                <MessageScrollerContent className="mx-auto w-full max-w-3xl gap-0 px-4 pb-20 sm:px-6 sm:pb-24">
                  {showIntroPlaceholder ? (
                    <ChatIntroPlaceholder withPoof={queuedMessage === null && !hasConversationStartFailed} />
                  ) : null}
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
                        wasStopped={stoppedReplyIds.has(message.id)}
                      />
                    </MessageScrollerItem>
                  ))}
                  {queuedMessage === null ? null : (
                    <MessageScrollerItem messageId="queued-message" scrollAnchor className={entryItemClassName(false)}>
                      <ChatTimelineMessage
                        isActive
                        message={{ id: "queued-message", parts: [{ text: queuedMessage, type: "text" }], role: "user" }}
                        status="submitted"
                      />
                    </MessageScrollerItem>
                  )}
                  {showPendingReply || (queuedMessage !== null && !hasConversationStartFailed) ? (
                    <ChatPendingReply isFirst={false} />
                  ) : null}
                  {hasConversationStartFailed && !isReady ? (
                    <ChatSendFailed withPoof onRetry={() => startConversation({ fresh: false })} />
                  ) : null}
                  {isSavingCall ? (
                    <div className={entryItemClassName(false)}>
                      <ChatStatusMarker label="Saving your call…" />
                    </div>
                  ) : null}
                  {isCallLate ? (
                    <div className={entryItemClassName(false)}>
                      <p className="text-sm text-neutral-500" role="status">
                        Your call is still saving. Reload in a minute to see it here.
                      </p>
                    </div>
                  ) : null}
                  {status === "error" ? (
                    <ChatSendFailed
                      withPoof={visibleMessages.at(-1)?.role !== "assistant"}
                      onRetry={() => {
                        clearError();
                        void regenerate();
                      }}
                    />
                  ) : null}
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
                  ref={composerRef}
                  isStreaming={isBusy}
                  onResumeRequest={handleResumeRequest}
                  onSend={handleSend}
                  onStop={handleStop}
                  onVoice={isVoiceEnabled() ? handleVoiceStart : undefined}
                  onVoiceIntent={() => void loadVoiceCall()}
                  voiceDisabled={!isReady || isSavingCall}
                />
              </div>
            </div>
          </div>
        </div>
        {voiceCall ? (
          <ChatVoiceBoundary
            fallback={
              <ChatVoiceScreen
                message={VOICE_REFUSAL_COPY.connect_failed}
                onEscape={() => handleVoiceEnd(null)}
                poof="confused"
              >
                <VoiceBackButton onClick={() => handleVoiceEnd(null)} />
              </ChatVoiceScreen>
            }
            onError={handleVoiceLoadFailed}
          >
            <Suspense
              fallback={
                <ChatVoiceScreen
                  announcement="Connecting to Poof"
                  note={VOICE_PRIVACY_NOTE}
                  onEscape={handleVoiceCancel}
                  poof="thinking"
                  status="Connecting"
                >
                  <VoiceEndButton onClick={handleVoiceCancel} />
                </ChatVoiceScreen>
              }
            >
              <ChatVoiceCall call={voiceCall.call} context={voiceCall.context} onClose={handleVoiceEnd} />
            </Suspense>
          </ChatVoiceBoundary>
        ) : null}
      </section>
    </PoofSignalsContext>
  );
}
