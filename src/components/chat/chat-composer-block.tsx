import { useForm } from "@tanstack/react-form";
import z from "zod";

import { ChatComposer } from "./chat-composer";

const FormSchema = z.object({
  message: z.string().min(1),
});

export function ChatComposerBlock({
  entryIndex = 0,
  isBusy,
  onResumeRequest,
  onSend,
}: {
  /** Position of the entry this composer would write, for the label lane. */
  entryIndex?: number;
  isBusy: boolean;
  onResumeRequest: () => void;
  onSend: (message: string) => Promise<void>;
}) {
  const form = useForm({
    defaultValues: {
      message: "",
    },
    validators: {
      onSubmit: FormSchema,
      onSubmitAsync: async ({ value }) => {
        await onSend(value.message);
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
              disabled={isBusy}
              entryIndex={entryIndex}
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
