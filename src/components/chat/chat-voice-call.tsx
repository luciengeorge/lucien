import { AnalyticsEvent, useAnalytics } from "#/lib/analytics";
import { settleVoiceCall } from "#/lib/functions/settle-voice-call";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { useEffect, useEffectEvent, useRef, useState } from "react";

import type { VoiceCallStart, VoiceRefusal } from "./chat-voice-start";
import type { PoofState } from "./poof-engine";

import { ChatVoiceContactForm } from "./chat-voice-contact-form";
import {
  ChatVoiceScreen,
  VOICE_PRIVACY_NOTE,
  VOICE_REFUSAL_COPY,
  VoiceBackButton,
  VoiceEndButton,
} from "./chat-voice-screen";
import { releaseUnusedCall } from "./chat-voice-start";
import { ChatVoiceWaveform, type VoiceWaveformHandle } from "./chat-voice-waveform";
import { formatCountdown } from "./chat-voice.utils";
import { useSettledSpeaking } from "./use-settled-speaking";

/** Refusals that are nobody's fault get a calm face; the rest look puzzled. */
const CALM_REFUSALS: ReadonlySet<VoiceRefusal> = new Set(["call_active", "global_limit", "ip_limit", "visitor_limit"]);
const COUNTDOWN_FROM_SECS = 30;

type EndedBy = "agent" | "error" | "timer" | "visitor";
type Phase = "connecting" | "live" | { refused: VoiceRefusal };

function isMicrophoneError(context: unknown): VoiceRefusal | null {
  if (!(context instanceof DOMException)) return null;
  if (context.name === "NotAllowedError" || context.name === "SecurityError") return "mic_denied";
  if (context.name === "NotFoundError") return "mic_missing";
  return null;
}

/**
 * A voice call with Poof, over the whole chat. Loaded on the first click, so the ElevenLabs SDK costs
 * nothing until someone wants to talk. `call` is already under way (microphone, then the server's
 * token), started by the click itself so the page fetches this code and the token at the same time.
 * `onClose` gets the call when it actually ran, so the chat knows where to wait for its transcript.
 */
export type EndedCall = { callId: string; conversationId: string };

export default function ChatVoiceCall(props: {
  call: Promise<VoiceCallStart>;
  context: string | null;
  onClose: (call: EndedCall | null) => void;
}) {
  return (
    <ConversationProvider>
      <VoiceCall {...props} />
    </ConversationProvider>
  );
}

function VoiceCall({
  call,
  context,
  onClose,
}: {
  call: Promise<VoiceCallStart>;
  context: string | null;
  onClose: (call: EndedCall | null) => void;
}) {
  const { capture } = useAnalytics();
  const [phase, setPhase] = useState<Phase>("connecting");
  const [secsLeft, setSecsLeft] = useState<number | null>(null);
  const [isContactOpen, setIsContactOpen] = useState(false);
  // Refs, not state: the SDK's callbacks can land before React has rendered the last change.
  const callRef = useRef<{
    callId: string;
    connectedAt: number | null;
    conversationId: string;
    elevenConversationId: string | null;
    maxSecs: number;
  } | null>(null);
  const endButtonRef = useRef<HTMLButtonElement>(null);
  const waveformRef = useRef<VoiceWaveformHandle>(null);
  const settledRef = useRef(false);
  const releasedRef = useRef(false);
  const unmountTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  /** Never once connected: from then on the webhook settles the call's real time. */
  const releaseIfUnconnected = () => {
    if (releasedRef.current || callRef.current?.connectedAt) return;
    releasedRef.current = true;
    releaseUnusedCall(call);
  };

  const refuse = (reason: VoiceRefusal) => {
    if (settledRef.current) return;
    settledRef.current = true;
    capture(AnalyticsEvent.voiceCallRefused, { reason });
    setPhase({ refused: reason });
    releaseIfUnconnected();
  };

  const finish = (endedBy: EndedBy) => {
    if (settledRef.current) return;
    settledRef.current = true;
    conversation.endSession();
    const current = callRef.current;
    if (!current?.connectedAt) {
      onClose(null);
      return;
    }
    // Settles it from ElevenLabs' own record now, rather than waiting on the post-call webhook.
    if (current.elevenConversationId) {
      void settleVoiceCall({
        data: { callId: current.callId, elevenConversationId: current.elevenConversationId },
      }).catch(() => {});
    }
    capture(AnalyticsEvent.voiceCallEnded, {
      duration_secs: Math.round((Date.now() - current.connectedAt) / 1000),
      ended_by: endedBy,
    });
    onClose({ callId: current.callId, conversationId: current.conversationId });
  };

  const conversation = useConversation({
    onConnect: ({ conversationId: elevenConversationId }) => {
      const current = callRef.current;
      if (!current || settledRef.current) return;
      current.connectedAt = Date.now();
      current.elevenConversationId = elevenConversationId;
      setPhase("live");
      if (context) conversation.sendContextualUpdate(context);
      capture(AnalyticsEvent.voiceCallStarted, { max_secs: current.maxSecs });
    },
    onDisconnect: (details) => {
      if (!callRef.current?.connectedAt) {
        refuse("connect_failed");
        return;
      }
      finish(details.reason === "agent" ? "agent" : details.reason === "error" ? "error" : "visitor");
    },
    onError: (_message, error) => {
      if (callRef.current?.connectedAt) finish("error");
      else refuse(isMicrophoneError(error) ?? "connect_failed");
    },
  });

  const begin = useEffectEvent((result: VoiceCallStart) => {
    if (settledRef.current) return;
    if (!result.ok) {
      refuse(result.reason);
      return;
    }
    callRef.current = {
      callId: result.callId,
      connectedAt: null,
      conversationId: result.conversationId,
      elevenConversationId: null,
      maxSecs: result.maxSecs,
    };
    try {
      conversation.startSession({
        clientTools: {
          show_contact_form: () => {
            setIsContactOpen(true);
          },
        },
        connectionType: "webrtc",
        conversationToken: result.token,
        dynamicVariables: { call_id: result.callId, today: result.today },
      });
    } catch {
      refuse("connect_failed");
    }
  });

  // Leaving mid-connect (End, Escape, or the page moving on) hands the call back. Deferred, so
  // StrictMode's rehearsal unmount, which remounts at once, cancels it.
  const releaseOnLeave = useEffectEvent(releaseIfUnconnected);
  useEffect(() => {
    clearTimeout(unmountTimerRef.current);
    return () => {
      unmountTimerRef.current = setTimeout(() => releaseOnLeave(), 0);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void call.then((result) => {
      if (!cancelled) begin(result);
    });
    return () => {
      cancelled = true;
    };
  }, [call]);

  const tick = useEffectEvent(() => {
    const current = callRef.current;
    if (!current?.connectedAt) return;
    const left = current.maxSecs - (Date.now() - current.connectedAt) / 1000;
    if (left <= 0) {
      finish("timer");
      return;
    }
    setSecsLeft(left <= COUNTDOWN_FROM_SECS ? Math.ceil(left) : null);
  });

  useEffect(() => {
    if (phase !== "live") return;
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const refused = typeof phase === "object" ? phase.refused : null;
  const back = () => onClose(null);
  const closeContact = () => {
    setIsContactOpen(false);
    endButtonRef.current?.focus();
  };
  const handleEscape = () => {
    if (isContactOpen) closeContact();
    else if (refused) back();
    else finish("visitor");
  };

  const agentTalking = useSettledSpeaking(conversation.isSpeaking);
  const hearsVisitor = phase === "live" && !agentTalking;
  const poof: PoofState = refused
    ? CALM_REFUSALS.has(refused)
      ? "idle"
      : "confused"
    : phase === "live"
      ? agentTalking
        ? "talking"
        : "listening"
      : "thinking";

  return (
    <ChatVoiceScreen
      belowPoof={hearsVisitor ? <ChatVoiceWaveform ref={waveformRef} /> : null}
      levels={
        phase === "live"
          ? () => {
              // Poof's frame drives the waveform too: one animation loop for the whole call.
              if (hearsVisitor) waveformRef.current?.draw(conversation.getInputByteFrequencyData());
              return { input: conversation.getInputVolume(), output: conversation.getOutputVolume() };
            }
          : undefined
      }
      announcement={refused ? undefined : phase === "live" ? "Connected to Poof" : "Connecting to Poof"}
      message={refused ? VOICE_REFUSAL_COPY[refused] : undefined}
      note={phase === "connecting" ? VOICE_PRIVACY_NOTE : undefined}
      onEscape={handleEscape}
      panel={isContactOpen ? <ChatVoiceContactForm onClose={closeContact} /> : null}
      poof={poof}
      status={refused ? undefined : phase === "live" ? (agentTalking ? "Talking" : "Listening") : "Connecting"}
    >
      {secsLeft === null ? null : (
        <p className="font-mono text-sm text-neutral-500 tabular-nums">{`${formatCountdown(secsLeft)} left`}</p>
      )}
      {refused ? (
        <VoiceBackButton onClick={back} />
      ) : (
        <VoiceEndButton ref={endButtonRef} onClick={() => finish("visitor")} />
      )}
    </ChatVoiceScreen>
  );
}
