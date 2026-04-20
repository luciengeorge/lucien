import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Spinner } from "#/components/ui/spinner";
import { Navigation03Icon } from "@hugeicons-pro/core-stroke-rounded";
import { HugeiconsIcon } from "@hugeicons/react";

export function ChatComposer({
  canSubmit,
  disabled,
  isSubmitting,
  message,
  onBlur,
  onChange,
  onSubmit,
}: {
  canSubmit: boolean;
  disabled: boolean;
  isSubmitting: boolean;
  message: string;
  onBlur: React.FocusEventHandler<HTMLInputElement>;
  onChange: (value: string) => void;
  onSubmit: React.SubmitEventHandler<HTMLFormElement>;
}) {
  return (
    <form
      className="flex items-end gap-2 border-t border-neutral-950/8 pt-2.5 pb-2 sm:gap-2.5 sm:pt-4 sm:pb-3"
      onSubmit={onSubmit}
    >
      <div className="grow">
        <Label className="sr-only" htmlFor="message">
          Ask Poof about Lucien
        </Label>
        <Input
          aria-label="Ask Poof about Lucien"
          className="h-10 rounded-full border-transparent bg-neutral-950/3 px-3.5 text-base shadow-none ring-1 ring-neutral-950/10 placeholder:text-neutral-500 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-neutral-950/15 max-sm:text-[15px] sm:h-11 sm:px-4 sm:text-base"
          disabled={disabled || isSubmitting}
          id="message"
          name="message"
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Ask about Lucien's work, background, projects, or interests"
          value={message}
        />
      </div>

      <Button
        size="icon"
        type="submit"
        className="size-10 rounded-full  sm:size-11"
        disabled={disabled || isSubmitting || !canSubmit || message.length === 0}
      >
        {isSubmitting ? <Spinner /> : <HugeiconsIcon icon={Navigation03Icon} />}
        <span className="sr-only">Send</span>
      </Button>
    </form>
  );
}
