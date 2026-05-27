import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Spinner } from "#/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "#/components/ui/tooltip";
import { File01Icon, Navigation03Icon } from "@hugeicons-pro/core-stroke-rounded";
import { HugeiconsIcon } from "@hugeicons/react";

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
  onBlur: React.FocusEventHandler<HTMLInputElement>;
  onChange: (value: string) => void;
  onResumeRequest: () => void;
  onSubmit: React.SubmitEventHandler<HTMLFormElement>;
}) {
  const isInputBusy = disabled || isSubmitting;

  return (
    <form className="border-t border-neutral-950/8 pt-2.5 pb-2 sm:pt-4 sm:pb-3" onSubmit={onSubmit}>
      <div className="relative">
        <Input
          aria-label="Ask Poof about Lucien"
          className="h-12 w-full rounded-full border-transparent bg-neutral-950/3 pr-24 pl-4 text-base shadow-none ring-1 ring-neutral-950/10 placeholder:text-neutral-500 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-neutral-950/15 sm:h-13 sm:pr-28 sm:pl-5 sm:text-base"
          disabled={isInputBusy}
          name="message"
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Ask about Lucien's work, background, projects, or interests"
          value={message}
        />
        <div className="absolute inset-y-0 right-1.5 flex items-center gap-1 sm:right-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    className="size-9 shrink-0 rounded-full text-neutral-700 hover:bg-neutral-950/6 hover:text-neutral-950 sm:size-10"
                    disabled={isInputBusy}
                    onClick={onResumeRequest}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <HugeiconsIcon icon={File01Icon} size={18} />
                    <span className="sr-only">Resume</span>
                  </Button>
                }
              />
              <TooltipContent>Get Lucien's resume</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            className="size-9 shrink-0 rounded-full sm:size-10"
            disabled={isInputBusy || !canSubmit || message.length === 0}
            size="icon"
            type="submit"
          >
            {isSubmitting ? <Spinner /> : <HugeiconsIcon icon={Navigation03Icon} />}
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>
    </form>
  );
}
