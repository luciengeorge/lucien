import { ScrollArea } from "#/components/ui/scroll-area";
import { useChat } from "@ai-sdk/react";
import { useForm } from "@tanstack/react-form";
import { DefaultChatTransport } from "ai";
import { useEffect } from "react";
import "streamdown/styles.css";
import z from "zod";

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

let hasStartedBootstrap = false;

export function ChatPage() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  useEffect(() => {
    if (messages.length > 0 || hasStartedBootstrap) return;

    hasStartedBootstrap = true;
    void sendMessage({ text: INTRO_PROMPT });
  }, [messages.length, sendMessage]);

  const visibleMessages = messages.filter((message) => !isBootstrapMessage(message));
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
        await sendMessage({ text: value.message });
        form.reset();
      },
    },
  });

  const onSubmit: React.SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    event.stopPropagation();
    form.handleSubmit();
  };

  const handleStarterPrompt = async (prompt: string) => {
    await sendMessage({ text: prompt });
  };

  const isBusy = status === "submitted" || status === "streaming";

  return (
    <section className="flex min-h-0 grow overflow-hidden bg-background py-6">
      <div className="flex min-h-0 w-full grow flex-col gap-4 py-4 sm:gap-5 sm:py-6">
        <ScrollArea className="min-h-0 grow">
          <div className="mx-auto w-full max-w-3xl px-4 pb-24 sm:px-6 sm:pb-24">
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
          </div>
        </div>
      </div>
    </section>
  );
}
