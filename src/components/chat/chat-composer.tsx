import { Button } from "#/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupTextarea } from "#/components/ui/input-group";
import { Spinner } from "#/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "#/components/ui/tooltip";
import { StopIcon } from "@hugeicons-pro/core-solid-rounded";
import { AudioWave01Icon, File01Icon, Navigation03Icon } from "@hugeicons-pro/core-stroke-rounded";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useEffectEvent, useRef } from "react";

import { usePoofSignals } from "./poof-signals";

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

  return (
    <form className="pt-2 pb-2 sm:pt-3 sm:pb-3" onSubmit={onSubmit}>
      <InputGroup className="rounded-3xl border-transparent bg-neutral-950/3 ring-1 ring-neutral-950/10 has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-2 has-[[data-slot=input-group-control]:focus-visible]:ring-neutral-950/15">
        <InputGroupTextarea
          aria-label="Ask Poof about Lucien"
          className="max-h-40 min-h-0 resize-none overflow-y-auto py-3 pl-4 text-base placeholder:text-neutral-500 sm:py-3.5 sm:pl-5 sm:text-base"
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
        {/* Beside the text, not under it: an empty composer is one line, and it grows as you type. */}
        <InputGroupAddon align="inline-end" className="gap-1 self-end pr-1.5 pb-1.5 sm:pr-2 sm:pb-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    aria-label="Resume"
                    className="size-9 shrink-0 rounded-full text-neutral-700 hover:bg-neutral-950/6 hover:text-neutral-950 sm:size-10"
                    disabled={isStreaming}
                    onClick={onResumeRequest}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <HugeiconsIcon icon={File01Icon} size={18} />
                  </Button>
                }
              />
              <TooltipContent>Get Lucien's resume</TooltipContent>
            </Tooltip>
            {onVoice ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      ref={voiceButtonRef}
                      aria-label="Talk to Poof"
                      className="size-9 shrink-0 rounded-full text-neutral-700 hover:bg-neutral-950/6 hover:text-neutral-950 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:hover:bg-transparent sm:size-10"
                      disabled={isStreaming || voiceDisabled || voiceResting}
                      focusableWhenDisabled={voiceResting}
                      onClick={onVoice}
                      onFocus={onVoiceIntent}
                      onPointerEnter={onVoiceIntent}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <HugeiconsIcon icon={AudioWave01Icon} size={18} />
                    </Button>
                  }
                />
                <TooltipContent>{voiceResting ? "Voice is resting" : "Talk to Poof"}</TooltipContent>
              </Tooltip>
            ) : null}
          </TooltipProvider>
          {/* Distinct keys: one reused <button> flipped to type=submit mid-click would send from the Stop click. */}
          {isStreaming ? (
            <Button
              key="stop"
              className="size-9 shrink-0 rounded-full sm:size-10"
              onClick={onStop}
              size="icon"
              type="button"
            >
              <HugeiconsIcon icon={StopIcon} size={16} />
              <span className="sr-only">Stop</span>
            </Button>
          ) : (
            <Button
              key="send"
              className="size-9 shrink-0 rounded-full sm:size-10"
              disabled={!canSend}
              size="icon"
              type="submit"
            >
              {isSubmitting ? <Spinner /> : <HugeiconsIcon icon={Navigation03Icon} />}
              <span className="sr-only">Send</span>
            </Button>
          )}
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}
