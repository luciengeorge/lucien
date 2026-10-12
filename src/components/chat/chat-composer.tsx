import { Button } from "#/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupTextarea } from "#/components/ui/input-group";
import { Spinner } from "#/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "#/components/ui/tooltip";
import { StopIcon } from "@hugeicons-pro/core-solid-rounded";
import { File01Icon, Navigation03Icon } from "@hugeicons-pro/core-stroke-rounded";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef } from "react";

/** Touch-primary devices, where autofocus would raise the keyboard over the page. */
function isCoarsePointer(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

function isTypingTarget(element: Element | null): boolean {
  if (!(element instanceof HTMLElement)) return false;
  return (
    element.isContentEditable || element.matches("input, textarea, select") || Boolean(element.closest("[role=dialog]"))
  );
}

/** A printable key typed with nothing focused for typing goes to the composer. Space still scrolls the page. */
function useTypeAnywhereToFocus(textareaRef: React.RefObject<HTMLTextAreaElement | null>) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const textarea = textareaRef.current;
      if (!textarea || event.defaultPrevented || event.isComposing) return;
      if (event.key.length !== 1 || event.key === " " || event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTypingTarget(document.activeElement)) return;
      // Focusing during keydown makes the browser deliver this keystroke to the textarea.
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [textareaRef]);
}

export function ChatComposer({
  canSubmit,
  isStreaming,
  isSubmitting,
  message,
  onBlur,
  onChange,
  onResumeRequest,
  onStop,
  onSubmit,
}: {
  canSubmit: boolean;
  isStreaming: boolean;
  isSubmitting: boolean;
  message: string;
  onBlur: React.FocusEventHandler<HTMLTextAreaElement>;
  onChange: (value: string) => void;
  onResumeRequest: () => void;
  onStop: () => void;
  onSubmit: React.SubmitEventHandler<HTMLFormElement>;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useTypeAnywhereToFocus(textareaRef);

  // Not `autoFocus`: the server cannot see the pointer, so the attribute would
  // reach touch devices in the HTML and raise their keyboard before hydration.
  useEffect(() => {
    if (!isCoarsePointer()) textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isStreaming) return;
    const onKeyDown = (event: KeyboardEvent) => {
      // A dialog, menu, IME composition or Streamdown's link modal owns Escape: they
      // close on it without preventDefault, and the modal has no dialog role.
      if (
        event.key !== "Escape" ||
        event.defaultPrevented ||
        event.isComposing ||
        document.activeElement?.closest("[role=dialog], [role=menu]") ||
        document.querySelector("[data-streamdown=link-safety-modal]")
      )
        return;
      onStop();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isStreaming, onStop]);
  const canSend = !isStreaming && !isSubmitting && canSubmit && message.length > 0;

  return (
    <form className="border-t border-neutral-950/8 pt-2.5 pb-2 sm:pt-4 sm:pb-3" onSubmit={onSubmit}>
      <InputGroup className="rounded-3xl border-transparent bg-neutral-950/3 ring-1 ring-neutral-950/10 has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-2 has-[[data-slot=input-group-control]:focus-visible]:ring-neutral-950/15">
        <InputGroupTextarea
          aria-label="Ask Poof about Lucien"
          className="max-h-40 min-h-0 resize-none overflow-y-auto py-3 pl-4 text-base placeholder:text-neutral-500 sm:py-3.5 sm:pl-5 sm:text-base"
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
          ref={textareaRef}
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
                    disabled={isStreaming}
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
          {isStreaming ? (
            <Button className="size-9 shrink-0 rounded-full sm:size-10" onClick={onStop} size="icon" type="button">
              <HugeiconsIcon icon={StopIcon} size={16} />
              <span className="sr-only">Stop</span>
            </Button>
          ) : (
            <Button className="size-9 shrink-0 rounded-full sm:size-10" disabled={!canSend} size="icon" type="submit">
              {isSubmitting ? <Spinner /> : <HugeiconsIcon icon={Navigation03Icon} />}
              <span className="sr-only">Send</span>
            </Button>
          )}
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}
