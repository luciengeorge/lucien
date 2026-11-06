import { Button } from "#/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupTextarea } from "#/components/ui/input-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "#/components/ui/tooltip";
import { cn } from "#/lib/utils";
import { StopIcon } from "@hugeicons-pro/core-solid-rounded";
import { ArrowUp02Icon, AudioWave01Icon, File01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useEffectEvent, useRef, useState } from "react";

import { usePoofSignals } from "./poof-signals";

const PRIMARY_ACTION_CLASS = "size-8 shrink-0 rounded-full active:scale-[0.96] sm:size-7";

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
  onVoice,
  onVoiceIntent,
  textareaRef: givenTextareaRef,
  voiceButtonRef,
  voiceDisabled = false,
  voiceResting = false,
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
  /** Starts a voice call. No button without it. */
  onVoice?: () => void;
  /** The visitor is reaching for the voice button: a chance to load the call ahead of the click. */
  onVoiceIntent?: () => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  voiceButtonRef?: React.Ref<HTMLButtonElement>;
  voiceDisabled?: boolean;
  /** Voice is paused for everyone: the button stays focusable so its tooltip can say so. */
  voiceResting?: boolean;
}) {
  const ownTextareaRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = givenTextareaRef ?? ownTextareaRef;
  const poofSignals = usePoofSignals();
  useTypeAnywhereToFocus(textareaRef);

  // Not `autoFocus`: the server cannot see the pointer, so the attribute would
  // reach touch devices in the HTML and raise their keyboard before hydration.
  useEffect(() => {
    if (!isCoarsePointer()) textareaRef.current?.focus();
  }, [textareaRef]);

  const stopOnEscape = useEffectEvent((event: KeyboardEvent) => {
    // A dialog, menu, IME composition or Streamdown's link modal owns Escape: they
    // close on it without preventDefault, and the modal has no dialog role.
    if (
      event.key !== "Escape" ||
      event.isComposing ||
      document.activeElement?.closest("[role=dialog], [role=menu]") ||
      document.querySelector("[data-streamdown=link-safety-modal]")
    )
      return;
    onStop();
  });

  // One capture-phase listener per stream, so it runs before any bubble-phase
  // listener that closes a modal, whichever was added first.
  useEffect(() => {
    if (!isStreaming) return;
    const onKeyDown = (event: KeyboardEvent) => stopOnEscape(event);
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [isStreaming]);
  const canSend = !isStreaming && !isSubmitting && canSubmit && message.length > 0;
  const hasText = message.trim().length > 0;
  // Only a swap animates: the button the page loads with just appears.
  const [prevHasText, setPrevHasText] = useState(hasText);
  const [hasSwapped, setHasSwapped] = useState(false);
  if (prevHasText !== hasText) {
    setPrevHasText(hasText);
    setHasSwapped(true);
  }
  const swapClass = hasSwapped
    ? "animate-in fade-in-0 zoom-in-75 duration-150 ease-out motion-reduce:animate-none"
    : undefined;

  return (
    <form className="py-2" onSubmit={onSubmit}>
      <InputGroup className="rounded-[20px] border-0 bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.05),0_1px_2px_rgb(0_0_0/0.04),0_4px_16px_rgb(0_0_0/0.05)] transition-shadow duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:shadow-[0_0_0_1px_rgb(0_0_0/0.07),0_1px_2px_rgb(0_0_0/0.04),0_4px_16px_rgb(0_0_0/0.06)] has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:shadow-[0_0_0_1px_rgb(0_0_0/0.1),0_1px_2px_rgb(0_0_0/0.05),0_6px_24px_rgb(0_0_0/0.08)] has-[[data-slot=input-group-control]:focus-visible]:ring-0">
        <InputGroupTextarea
          aria-label="Ask Poof about Lucien"
          className="max-h-40 min-h-0 resize-none overflow-y-auto py-2 pl-4 text-base leading-6 placeholder:text-neutral-500 placeholder:transition-colors placeholder:duration-150 focus:placeholder:text-neutral-400 sm:text-[15px]"
          enterKeyHint="send"
          name="message"
          onBlur={onBlur}
          onChange={(event) => {
            onChange(event.target.value);
            poofSignals?.emit("typing");
          }}
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
          placeholder="Ask anything about Lucien"
          rows={1}
          value={message}
        />
        {/* Beside the text, not under it: an empty composer is one line, and it grows as you type.
            The main slot is voice while the composer is empty, Send once there is text, and Stop while a reply streams. */}
        <InputGroupAddon
          align="inline-end"
          className="gap-1 self-end py-0 pr-1 pb-1 has-[>button]:mr-0 sm:gap-1.5 sm:pr-1.5 sm:pb-1.5"
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    aria-label="Resume"
                    className="size-8 shrink-0 rounded-full bg-neutral-950/6 text-neutral-700 hover:bg-neutral-950/10 hover:text-neutral-950 active:scale-[0.96] sm:size-7"
                    data-emphasis="secondary"
                    disabled={isStreaming}
                    onClick={onResumeRequest}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <HugeiconsIcon icon={File01Icon} size={16} />
                  </Button>
                }
              />
              <TooltipContent>Get Lucien's resume</TooltipContent>
            </Tooltip>
            {/* Distinct keys: one <button> reused across Stop and voice would carry the Stop click into a call. */}
            {isStreaming ? (
              <Button
                key="stop"
                className={PRIMARY_ACTION_CLASS}
                data-emphasis="primary"
                onClick={onStop}
                size="icon"
                type="button"
              >
                <HugeiconsIcon icon={StopIcon} size={14} />
                <span className="sr-only">Stop</span>
              </Button>
            ) : hasText ? (
              <Button
                key="send"
                className={cn(PRIMARY_ACTION_CLASS, swapClass)}
                data-emphasis="primary"
                disabled={!canSend}
                size="icon"
                type="submit"
              >
                <HugeiconsIcon icon={ArrowUp02Icon} size={16} strokeWidth={2} />
                <span className="sr-only">Send</span>
              </Button>
            ) : onVoice ? (
              <Tooltip key="voice">
                <TooltipTrigger
                  render={
                    <Button
                      ref={voiceButtonRef}
                      aria-label="Talk to Poof"
                      className={cn(
                        PRIMARY_ACTION_CLASS,
                        "aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:hover:bg-primary",
                        swapClass,
                      )}
                      data-emphasis="primary"
                      disabled={voiceDisabled || voiceResting}
                      focusableWhenDisabled={voiceResting}
                      onClick={onVoice}
                      onFocus={onVoiceIntent}
                      onPointerEnter={onVoiceIntent}
                      size="icon"
                      type="button"
                    >
                      <HugeiconsIcon icon={AudioWave01Icon} size={16} />
                    </Button>
                  }
                />
                <TooltipContent>{voiceResting ? "Voice is resting" : "Talk to Poof"}</TooltipContent>
              </Tooltip>
            ) : null}
          </TooltipProvider>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}
