import type { ReactNode } from "react";

import { Button } from "#/components/ui/button";
import { CallEnd01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useEffectEvent, useRef } from "react";
import { createPortal } from "react-dom";

import type { VoiceRefusal } from "./chat-voice-start";
import type { PoofLevels, PoofState } from "./poof-engine";

import { PoofMark } from "./poof-mark";

const STILL_TYPING = "The chat still works if you'd like to type.";

export const VOICE_REFUSAL_COPY: Record<VoiceRefusal, string> = {
  call_active: "A call is already open, maybe in another tab. Hang up there to start a new one.",
  connect_failed: `The call couldn't connect. ${STILL_TYPING}`,
  global_limit: `Poof's voice is resting for the month. ${STILL_TYPING}`,
  ip_limit: `That's all the talking for today. ${STILL_TYPING}`,
  mic_blocked_system:
    "Your computer is keeping the microphone from this browser. Allow it in your privacy settings, then try again, or keep typing.",
  mic_busy: "Another app is using your microphone. Close it and try again, or keep typing.",
  mic_denied:
    "Poof can't hear you yet. To let it, click the icon at the left of the address bar, allow the microphone for this site, then try again.",
  resting: "Poof's voice is resting for now. The chat still works.",
  mic_missing: "Poof can't find a microphone. Plug one in and try again, or keep typing.",
  unavailable: `Voice isn't available right now. ${STILL_TYPING}`,
  visitor_limit: `That's all the talking for today. ${STILL_TYPING}`,
};

export const VOICE_PRIVACY_NOTE = (
  <>
    Your voice is processed by ElevenLabs to run the call, and the transcript is saved to this chat.{" "}
    <a
      className="text-neutral-700 underline decoration-neutral-950/25 underline-offset-[3px] transition-colors hover:decoration-neutral-950"
      href="/privacy"
      rel="noreferrer"
      target="_blank"
    >
      Privacy
    </a>
  </>
);

/**
 * The voice call's whole screen: Poof, large, with one line of status under it and the controls at
 * the bottom. No transcript: the call is something to listen to, and the words land in the chat
 * afterwards. Also the loading screen while the call's code arrives, so it opens at once.
 *
 * Portalled to the body: `main` is its own stacking context, so from inside it the site nav would
 * sit on top of the call.
 */
export function ChatVoiceScreen({
  announcement,
  belowPoof,
  children,
  levels,
  message,
  note,
  onEscape,
  panel,
  poof,
  status,
}: {
  /** Read out by screen readers: the connection's milestones, not every turn of the talk. */
  announcement?: string;
  /** A small live detail right under Poof. Its row is always there, so nothing shifts when it comes and goes. */
  belowPoof?: ReactNode;
  /** The controls along the bottom. */
  children: ReactNode;
  levels?: () => PoofLevels;
  message?: ReactNode;
  note?: ReactNode;
  onEscape: () => void;
  /** Something the call opened on top of itself, like the contact form. */
  panel?: ReactNode;
  poof: PoofState;
  status?: string;
}) {
  const handleEscape = useEffectEvent((event: KeyboardEvent) => {
    if (event.key !== "Escape" || event.isComposing || event.defaultPrevented) return;
    onEscape();
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => handleEscape(event);
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Modal for real: the page behind can be neither tabbed to nor read while the call is up.
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    const behind = [...document.body.children].filter(
      (element) => element !== dialog && !element.hasAttribute("inert"),
    );
    for (const element of behind) element.setAttribute("inert", "");
    return () => {
      for (const element of behind) element.removeAttribute("inert");
    };
  }, []);

  return createPortal(
    <div
      ref={dialogRef}
      aria-label="Voice call with Poof"
      aria-modal="true"
      className="fixed inset-0 z-50 flex animate-in flex-col bg-background px-4 pt-[max(env(safe-area-inset-top),1.5rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)] duration-200 fade-in sm:px-6"
      role="dialog"
    >
      <div className="flex min-h-0 grow flex-col items-center justify-center gap-5 text-center">
        <PoofMark className="mr-0 size-36 sm:size-44" levels={levels} state={poof} />
        <div className="-mt-2 flex h-6 items-center justify-center">{belowPoof}</div>
        <p aria-hidden="true" className="h-5 font-mono text-sm tracking-wide text-neutral-500 uppercase">
          {status}
        </p>
        <div role="status">
          {announcement ? <span className="sr-only">{announcement}</span> : null}
          {message ? <p className="max-w-sm text-base text-pretty text-neutral-800">{message}</p> : null}
        </div>
        {note ? <p className="max-w-xs text-xs text-pretty text-neutral-500">{note}</p> : null}
      </div>
      <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-3">{children}</div>
      {panel}
    </div>,
    document.body,
  );
}

export function VoiceBackButton({ onClick }: { onClick: () => void }) {
  return (
    <Button autoFocus className="h-12 rounded-full px-6 text-base" onClick={onClick} type="button" variant="outline">
      Back to chat
    </Button>
  );
}

export function VoiceEndButton({ onClick, ref }: { onClick: () => void; ref?: React.Ref<HTMLButtonElement> }) {
  return (
    <Button
      ref={ref}
      autoFocus
      className="h-12 gap-2 rounded-full px-6 text-base"
      onClick={onClick}
      type="button"
      variant="destructive"
    >
      <HugeiconsIcon icon={CallEnd01Icon} size={20} />
      End call
    </Button>
  );
}
