import { Spinner } from "#/components/ui/spinner";
import { Textarea } from "#/components/ui/textarea";

/**
 * The composer is the next blank line of the ledger.
 *
 * Same label lane as every turn above it, a stamp caret where the writing
 * starts, and one solid ink rule underneath to write on. There is no box, so
 * the rule has to carry the focus state on its own.
 */
export function ChatComposer({
  canSubmit,
  disabled,
  entryIndex,
  isSubmitting,
  message,
  onBlur,
  onChange,
  onResumeRequest,
  onSubmit,
}: {
  canSubmit: boolean;
  disabled: boolean;
  entryIndex: number;
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
    <form className="flex flex-col gap-3 sm:flex-row sm:gap-11" onSubmit={onSubmit}>
      <div className="hidden shrink-0 flex-col gap-1.5 pt-4 sm:flex sm:w-[120px]">
        <p className="font-mono text-[11px] font-semibold tracking-[0.22em] text-label">YOU</p>
        <p className="font-mono text-[11px] tracking-[0.22em] text-label/80">
          {`ENTRY ${String(entryIndex + 1).padStart(2, "0")}`}
        </p>
      </div>

      <div className="flex flex-1 items-end gap-4 border-b-2 border-ink pt-3 pb-2.5 transition-colors focus-within:border-stamp">
        <span aria-hidden className="pb-1 font-mono text-lg leading-none text-stamp">
          ›
        </span>
        <Textarea
          aria-label="Ask Poof about Lucien"
          className="max-h-40 min-h-0 flex-1 resize-none overflow-y-auto rounded-none border-0 bg-transparent p-0 font-mono text-[16px] text-ink shadow-none transition-none placeholder:font-mono placeholder:text-[16px] placeholder:text-label focus-visible:border-0 focus-visible:ring-0 disabled:bg-transparent md:text-[16px]"
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
          placeholder="Ask about the work, the resume, or how to reach him"
          rows={1}
          value={message}
        />
        <div className="flex shrink-0 items-center gap-2.5 pb-0.5">
          <button
            className="h-9 border rule-hair px-3.5 font-mono text-[11px] tracking-[0.16em] text-ink-soft transition-colors hover:border-ink hover:text-ink disabled:opacity-40"
            disabled={isInputBusy}
            onClick={onResumeRequest}
            type="button"
          >
            RESUME ↓
          </button>
          <button
            className="flex h-9 items-center gap-2 bg-ink px-5 font-mono text-[11px] font-semibold tracking-[0.22em] text-paper transition-colors hover:bg-stamp disabled:opacity-40"
            disabled={!canSend}
            type="submit"
          >
            {isSubmitting ? <Spinner className="size-3.5" /> : null}
            SEND
          </button>
        </div>
      </div>
    </form>
  );
}
