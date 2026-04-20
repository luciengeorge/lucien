import type { ChatConversationState } from "#/lib/chat-types";
import type { UIMessage } from "ai";

import { ScrollArea } from "#/components/ui/scroll-area";
import { AnalyticsEvent, useAnalytics } from "#/lib/analytics";
import { startNewConversation } from "#/lib/functions/start-new-conversation";
import { useChat } from "@ai-sdk/react";
import { ArrowDown04Icon } from "@hugeicons-pro/core-solid-rounded";
import { HugeiconsIcon } from "@hugeicons/react";
import { useForm } from "@tanstack/react-form";
import { DefaultChatTransport } from "ai";
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import "streamdown/styles.css";
import z from "zod";

import { Button } from "../ui/button";
import { ChatComposer } from "./chat-composer";
import { ChatIntroPlaceholder } from "./chat-intro-placeholder";
import { ChatPendingReply } from "./chat-pending-reply";
import { ChatStarterPrompts } from "./chat-starter-prompts";
import { ChatTimelineMessage } from "./chat-timeline-message";
import { INTRO_PROMPT } from "./chat.constants";
import { isBootstrapMessage } from "./chat.utils";

const FormSchema = z.object({
  message: z.string().min(1),
});
const UIMessagePartShapeSchema = z.object({ type: z.string() }).catchall(z.any());
const UIMessageShapeSchema = z.object({
  id: z.string().min(1),
  parts: z.array(UIMessagePartShapeSchema),
  role: z.enum(["assistant", "system", "user"]),
});
const InitialMessagesSchema = z.array(z.custom<UIMessage>((value) => UIMessageShapeSchema.safeParse(value).success));

const AUTO_SCROLL_THRESHOLD_PX = 96;

export function ChatPage({ initialChatState }: { initialChatState: ChatConversationState }) {
  const [chatState, setChatState] = useState(initialChatState);
  const { capture } = useAnalytics();

  useEffect(() => {
    capture(AnalyticsEvent.portfolioViewed, {
      entrypoint: "homepage",
    });

    if (initialChatState.conversation && initialChatState.messages.length > 0) {
      capture(AnalyticsEvent.conversationResumed, {
        message_count: initialChatState.messages.length,
      });
    }
  }, [capture, initialChatState.conversation, initialChatState.messages.length]);

  return <ChatConversation key={chatState.conversation?.id ?? "new-conversation"} chatState={chatState} onConversationChange={setChatState} />;
}

function ChatConversation({
  chatState,
  onConversationChange,
}: {
  chatState: ChatConversationState;
  onConversationChange: (state: ChatConversationState) => void;
}) {
  const { capture } = useAnalytics();
  const isCreatingConversationRef = useRef(false);
  const bootstrappedConversationIdRef = useRef<string | null>(null);
  const lastCompletedMessageIdRef = useRef<string | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const shouldFollowRef = useRef(true);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const initialMessages = useMemo(() => InitialMessagesSchema.parse(chatState.messages), [chatState.messages]);

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
    if (chatState.messages.length > 0 || messages.length > 0) return;

    if (!chatState.conversation) {
      if (isCreatingConversationRef.current) return;

      isCreatingConversationRef.current = true;
      void startNewConversation()
        .then((nextConversation) => {
          startTransition(() => {
            onConversationChange(nextConversation);
          });
        })
        .finally(() => {
          isCreatingConversationRef.current = false;
        });
      return;
    }

    if (bootstrappedConversationIdRef.current === chatState.conversation.id) return;

    bootstrappedConversationIdRef.current = chatState.conversation.id;
    capture(AnalyticsEvent.chatBootstrapRequested, {
      source: "bootstrap",
    });
    void sendMessage({ text: INTRO_PROMPT });
  }, [capture, chatState.conversation, chatState.messages.length, messages.length, onConversationChange, sendMessage]);

  const visibleMessages = useMemo(() => messages.filter((message) => !isBootstrapMessage(message)), [messages]);
  const hasVisibleUserMessage = visibleMessages.some((message) => message.role === "user");
  const showIntroPlaceholder = visibleMessages.length === 0;
  const showStarterPrompts = !hasVisibleUserMessage && !showIntroPlaceholder;
  const showPendingReply =
    !showIntroPlaceholder && status !== "ready" && status !== "error" && visibleMessages.at(-1)?.role === "user";

  const form = useForm({
    defaultValues: {
      message: "",
    },
    validators: {
      onSubmit: FormSchema,
      onSubmitAsync: async ({ value }) => {
        shouldFollowRef.current = true;
        capture(AnalyticsEvent.chatMessageSubmitted, {
          message_length: value.message.length,
          source: "composer",
        });
        await sendMessage({ text: value.message });
        form.reset();
      },
    },
  });

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

  const syncScrollState = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    const nextIsAtBottom = distanceFromBottom <= AUTO_SCROLL_THRESHOLD_PX;

    shouldFollowRef.current = nextIsAtBottom;
    setIsAtBottom(nextIsAtBottom);
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior,
    });
    shouldFollowRef.current = true;
    setIsAtBottom(true);
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    syncScrollState();

    const handleScroll = () => {
      syncScrollState();
    };

    viewport.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      viewport.removeEventListener("scroll", handleScroll);
    };
  }, [syncScrollState]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    if (messages.length === 0) {
      syncScrollState();
      return;
    }

    if (!shouldFollowRef.current) {
      syncScrollState();
      return;
    }

    const frame = requestAnimationFrame(() => {
      scrollToBottom(status === "streaming" ? "auto" : "smooth");
    });

    return () => cancelAnimationFrame(frame);
  }, [messages, scrollToBottom, status, syncScrollState]);

  const onSubmit: React.SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    event.stopPropagation();
    form.handleSubmit();
  };

  const handleStarterPrompt = async (prompt: string) => {
    shouldFollowRef.current = true;
    capture(AnalyticsEvent.starterPromptClicked, {
      prompt,
    });
    capture(AnalyticsEvent.chatMessageSubmitted, {
      message_length: prompt.length,
      source: "starter_prompt",
    });
    await sendMessage({ text: prompt });
  };

  const handleNewConversation = async () => {
    capture(AnalyticsEvent.newConversationClicked, {
      source: "cta",
    });

    const nextConversation = await startNewConversation();

    startTransition(() => {
      onConversationChange(nextConversation);
    });

    requestAnimationFrame(() => {
      scrollToBottom("auto");
    });
  };

  const isBusy = status === "submitted" || status === "streaming" || !chatState.conversation;

  return (
    <section className="flex min-h-0 grow overflow-hidden bg-background py-2 sm:py-6">
      <div className="flex min-h-0 w-full grow flex-col gap-2 py-1 sm:gap-5 sm:py-6">
        <div className="mx-auto flex w-full max-w-3xl justify-end px-4 sm:px-6">
          <Button variant="link" type="button" onClick={() => void handleNewConversation()}>
            New conversation
          </Button>
        </div>

        <ScrollArea className="min-h-0 grow" viewportRef={viewportRef}>
          <div className="mx-auto w-full max-w-3xl px-4 pb-20 sm:px-6 sm:pb-24">
            <ol className="space-y-0">
              {showIntroPlaceholder ? <ChatIntroPlaceholder /> : null}
              {visibleMessages.map((message, index) => (
                <ChatTimelineMessage key={message.id} isFirst={index === 0} message={message} status={status} />
              ))}
              {showPendingReply ? <ChatPendingReply isFirst={visibleMessages.length === 0} /> : null}
            </ol>
          </div>
        </ScrollArea>

        {showStarterPrompts ? (
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
            <ChatStarterPrompts onStarterPrompt={handleStarterPrompt} />
          </div>
        ) : null}

        <div className="sticky bottom-0 z-10 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/75">
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
            {!isAtBottom ? (
              <div className="flex justify-center pb-2">
                <Button
                  size="icon"
                  variant="outline"
                  type="button"
                  onClick={() => scrollToBottom("smooth")}
                  className="rounded-full"
                >
                  <span className="sr-only">scroll to bottom</span>
                  <span aria-hidden="true">
                    <HugeiconsIcon icon={ArrowDown04Icon} />
                  </span>
                </Button>
              </div>
            ) : null}
            <ComposerBlock form={form} isBusy={isBusy} onSubmit={onSubmit} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ComposerBlock({
  form,
  isBusy,
  onSubmit,
}: {
  form: {
    Field: React.ComponentType<{
      children: (field: { handleBlur: () => void; handleChange: (value: string) => void }) => React.ReactNode;
      name: "message";
    }>;
    Subscribe: React.ComponentType<{
      children: (state: { canSubmit: boolean; isSubmitting: boolean; message: string }) => React.ReactNode;
      selector: (state: { canSubmit: boolean; isSubmitting: boolean; values: { message: string } }) => {
        canSubmit: boolean;
        isSubmitting: boolean;
        message: string;
      };
    }>;
  };
  isBusy: boolean;
  onSubmit: React.SubmitEventHandler<HTMLFormElement>;
}) {
  return (
    <form.Subscribe
      selector={(state) => ({
        canSubmit: state.canSubmit,
        isSubmitting: state.isSubmitting,
        message: state.values.message,
      })}
    >
      {({ canSubmit, isSubmitting, message }) => (
        <form.Field name="message">
          {(field) => (
            <ChatComposer
              canSubmit={canSubmit}
              disabled={isBusy}
              isSubmitting={isSubmitting}
              message={String(message)}
              onBlur={() => field.handleBlur()}
              onChange={field.handleChange}
              onSubmit={onSubmit}
            />
          )}
        </form.Field>
      )}
    </form.Subscribe>
  );
}
