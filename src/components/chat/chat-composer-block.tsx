import { ChatComposer } from "./chat-composer";

export function ChatComposerBlock({
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
