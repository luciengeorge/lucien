import { useForm } from "@tanstack/react-form";
import z from "zod";

import { ChatComposer } from "./chat-composer";

const FormSchema = z.object({
  message: z.string().min(1),
});

export function ChatComposerBlock({
  isReady,
  isStreaming,
  onResumeRequest,
  onSend,
}: {
  /** False until the conversation exists, when there is nowhere to send. */
  isReady: boolean;
  /** True while a reply is arriving: still typable, not yet sendable. */
  isStreaming: boolean;
  onResumeRequest: () => void;
  onSend: (message: string) => Promise<void>;
}) {
  const form = useForm({
    defaultValues: {
      message: "",
    },
    validators: {
      onSubmit: FormSchema,
      /*
        Clear first, send second, and do not await the send. `onSend` resolves
        only when the whole reply has streamed - measured at 5.4s - so awaiting
        it left the sent text sitting in the box for the entire response.
      */
      onSubmitAsync: ({ value }) => {
        void onSend(value.message);
        form.reset();
      },
    },
  });

  const onSubmit: React.SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    event.stopPropagation();
    form.handleSubmit();
  };

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
              isReady={isReady}
              isStreaming={isStreaming}
              isSubmitting={isSubmitting}
              message={String(message)}
              onBlur={() => field.handleBlur()}
              onChange={field.handleChange}
              onResumeRequest={onResumeRequest}
              onSubmit={onSubmit}
            />
          )}
        </form.Field>
      )}
    </form.Subscribe>
  );
}
