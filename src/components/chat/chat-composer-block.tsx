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
  isReady: boolean;
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
      // `onSend` only resolves once the whole reply has streamed, so clear first.
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
