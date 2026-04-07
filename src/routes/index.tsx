import { useChat } from "@ai-sdk/react";
import { Navigation03Icon } from "@hugeicons-pro/core-stroke-rounded";
import { HugeiconsIcon } from "@hugeicons/react";
import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import { DefaultChatTransport } from "ai";
import { Streamdown } from "streamdown";
import "streamdown/styles.css";
import z from "zod";

import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { ScrollArea } from "#/components/ui/scroll-area";
import { Spinner } from "#/components/ui/spinner";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/")({ component: ChatPage });

const FormSchema = z.object({
  message: z.string().min(1),
});

function ChatPage() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const form = useForm({
    defaultValues: {
      message: "",
    },
    validators: {
      onSubmit: FormSchema,
      onSubmitAsync: async ({ value }) => {
        sendMessage({ text: value.message });
        form.reset();
      },
    },
  });

  const onSubmit = (event: React.SubmitEvent) => {
    event.preventDefault();
    event.stopPropagation();
    form.handleSubmit();
  };

  return (
    <>
      <ScrollArea className="min-h-0 grow">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(message.role === "user" ? "bg-accent text-accent-foreground" : "bg-primary text-white")}
          >
            {message.parts.map((part, idx) => {
              if (part.type === "reasoning") {
                return (
                  <div key={idx} className="mb-2 text-sm text-gray-500 italic">
                    Thinking: {part.text}
                  </div>
                );
              }
              if (part.type === "text") {
                return (
                  <Streamdown key={idx} isAnimating={status === "streaming"}>
                    {part.text}
                  </Streamdown>
                );
              }
              return null;
            })}
          </div>
        ))}
      </ScrollArea>

      <form
        className="flex shrink-0 rounded-lg border border-input bg-transparent focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50"
        onSubmit={onSubmit}
      >
        <form.Subscribe
          selector={(state) => ({
            canSubmit: state.canSubmit,
            isSubmitting: state.isSubmitting,
          })}
        >
          {({ isSubmitting, canSubmit }) => (
            <>
              <form.Field name="message">
                {(field) => (
                  <>
                    <Label className="sr-only" htmlFor={field.name}>
                      message
                    </Label>
                    <Input
                      name={field.name}
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={isSubmitting}
                      onBlur={field.handleBlur}
                      className="border-0! border-transparent! ring-0!"
                    />
                  </>
                )}
              </form.Field>
              <Button size="icon" disabled={status === "streaming" || isSubmitting || !canSubmit}>
                {isSubmitting ? <Spinner /> : <HugeiconsIcon icon={Navigation03Icon} />}
                <span className="sr-only">send</span>
              </Button>
            </>
          )}
        </form.Subscribe>
      </form>
    </>
  );
}
