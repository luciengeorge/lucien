import { useForm } from "@tanstack/react-form";
import { useImperativeHandle, useRef } from "react";
import z from "zod";

import { ChatComposer } from "./chat-composer";

const FormSchema = z.object({
  message: z.string().min(1),
});

export type ChatComposerHandle = {
  /** Puts text back in the composer (ahead of any draft), focused with the caret at the end. */
  restore: (text: string) => void;
};

export function ChatComposerBlock({
  isStreaming,
  onResumeRequest,
  onSend,
  onStop,
  ref,
}: {
  isStreaming: boolean;
  onResumeRequest: () => void;
  onSend: (message: string) => Promise<void>;
  onStop: () => void;
  ref?: React.Ref<ChatComposerHandle>;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  useImperativeHandle(
    ref,
    () => ({
      restore(text) {
        // A draft typed while the reply ran is kept after the restored question, never overwritten.
        const draft = String(form.state.values.message).trim();
        form.setFieldValue("message", draft ? `${text}\n${draft}` : text);
        // After the value has rendered, so the caret lands at the end of the restored text.
        requestAnimationFrame(() => {
          const textarea = textareaRef.current;
          if (!textarea) return;
          textarea.focus();
          textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        });
      },
    }),
    [form],
  );

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
              isStreaming={isStreaming}
              isSubmitting={isSubmitting}
              message={String(message)}
              onBlur={() => field.handleBlur()}
              onChange={field.handleChange}
              onResumeRequest={onResumeRequest}
              onStop={onStop}
              onSubmit={onSubmit}
              textareaRef={textareaRef}
            />
          )}
        </form.Field>
      )}
    </form.Subscribe>
  );
}
