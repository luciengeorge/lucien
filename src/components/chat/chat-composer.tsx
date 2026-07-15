import { Button } from "#/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupTextarea } from "#/components/ui/input-group";
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
  onBlur: React.FocusEventHandler<HTMLTextAreaElement>;
  onChange: (value: string) => void;
  onResumeRequest: () => void;
  onSubmit: React.SubmitEventHandler<HTMLFormElement>;
}) {
  const isInputBusy = disabled || isSubmitting;
  const canSend = !isInputBusy && canSubmit && message.length > 0;

  return (
    <form className="border-t border-neutral-950/8 pt-2.5 pb-2 sm:pt-4 sm:pb-3" onSubmit={onSubmit}>
      <InputGroup className="rounded-3xl border-transparent bg-neutral-950/3 ring-1 ring-neutral-950/10 has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-2 has-[[data-slot=input-group-control]:focus-visible]:ring-neutral-950/15">
        <InputGroupTextarea
          aria-label="Ask Poof about Lucien"
          className="max-h-40 min-h-0 resize-none overflow-y-auto py-3 pl-4 text-base placeholder:text-neutral-500 sm:py-3.5 sm:pl-5 sm:text-base"
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
          placeholder="Ask about Lucien's work, background, projects, or interests"
          rows={1}
          value={message}
        />
        <InputGroupAddon align="block-end" className="justify-end gap-1 px-2 pb-2 sm:px-2.5">
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
          <Button className="size-9 shrink-0 rounded-full sm:size-10" disabled={!canSend} size="icon" type="submit">
            {isSubmitting ? <Spinner /> : <HugeiconsIcon icon={Navigation03Icon} />}
            <span className="sr-only">Send</span>
          </Button>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}
