import { Spinner } from "#/components/ui/spinner";
import { Textarea } from "#/components/ui/textarea";

/**
 * One stone-ruled line to write on. The rule goes cedar on focus, which is the
 * whole focus state: there is no box to outline, so the line has to carry it.
 */
export function ChatComposer({
  canSubmit,
  disabled,
  isSubmitting,
  message,
  onBlur,
  onChange,
  onResumeRequest,
  onSubmit,
}: {
  canSubmit: boolean;
  disabled: boolean;
  isSubmitting: boolean;
  message: string;
  onBlur: React.FocusEventHandler<HTMLTextAreaElement>;
  onChange: (value: string) => void;
  onResumeRequest: () => void;
  onSubmit: React.SubmitEventHandler<HTMLFormElement>;
}) {
  const isInputBusy = disabled || isSubmitting;
  const canSend = !isInputBusy && canSubmit && message.length > 0;

  return (
    <form
      className="flex items-end gap-3 border-b-[1.5px] border-ink pt-4 pb-2.5 transition-colors focus-within:border-cedar"
      onSubmit={onSubmit}
    >
      <Textarea
        aria-label="Ask Poof about Lucien"
        className="max-h-40 min-h-0 flex-1 resize-none overflow-y-auto rounded-none border-0 bg-transparent p-0 font-sans text-[17px] text-ink shadow-none transition-none placeholder:font-sans placeholder:text-[17px] placeholder:text-label focus-visible:border-0 focus-visible:ring-0 disabled:bg-transparent md:text-[17px]"
        disabled={isInputBusy}
        name="message"
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
            return;
          }
          event.preventDefault();
          if (canSend) {
            event.currentTarget.form?.requestSubmit();
          }
        }}
        placeholder="Ask about his work, background, projects, or interests"
        rows={1}
        value={message}
      />
      <div className="flex shrink-0 items-center gap-5 pb-1.5">
        <button
          className="font-mono text-[11px] tracking-[0.14em] text-label transition-colors hover:text-cedar focus-visible:text-cedar disabled:opacity-40"
          disabled={isInputBusy}
          onClick={onResumeRequest}
          type="button"
        >
          RESUME
        </button>
        <button className="group flex items-center gap-2 disabled:opacity-40" disabled={!canSend} type="submit">
          <span className="font-mono text-[11px] tracking-[0.14em] text-cedar transition-colors group-hover:text-ink">
            ASK
          </span>
          {isSubmitting ? (
            <Spinner className="size-3.5 text-cedar" />
          ) : (
            <span
              aria-hidden
              className="text-sm leading-none text-cedar transition-transform group-hover:translate-x-1 group-focus-visible:translate-x-1"
            >
              →
            </span>
          )}
        </button>
      </div>
    </form>
  );
}
