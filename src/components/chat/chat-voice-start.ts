import type { StartVoiceCallResult } from "#/lib/functions/start-voice-call";

import { releaseVoiceCall } from "#/lib/functions/release-voice-call";
import { startVoiceCall } from "#/lib/functions/start-voice-call";

export type VoiceRefusal =
  | Extract<StartVoiceCallResult, { ok: false }>["reason"]
  | "connect_failed"
  | "mic_denied"
  | "mic_missing";

export type VoiceCallStart = Extract<StartVoiceCallResult, { ok: true }> | { ok: false; reason: VoiceRefusal };

export function isVoiceEnabled(): boolean {
  return import.meta.env.VITE_VOICE_ENABLED === "true";
}

/** Asks for the microphone and lets it go again: the SDK opens its own stream once the call connects. */
async function requestMicrophone(): Promise<"granted" | VoiceRefusal> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return "unavailable";
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    for (const track of stream.getTracks()) track.stop();
    return "granted";
  } catch (error) {
    if (!(error instanceof DOMException)) return "unavailable";
    if (error.name === "NotAllowedError" || error.name === "SecurityError") return "mic_denied";
    if (error.name === "NotFoundError") return "mic_missing";
    return "unavailable";
  }
}

/**
 * The microphone first: a visitor who blocks it should not spend a call from their daily allowance,
 * and a call reserved on the server is not given back until it goes stale.
 */
export async function requestVoiceCall(): Promise<VoiceCallStart> {
  const microphone = await requestMicrophone();
  if (microphone !== "granted") return { ok: false, reason: microphone };
  try {
    return await startVoiceCall();
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

/**
 * Gives back a call that was granted but never connected, so it does not hold the visitor's time
 * until it goes stale. Waits for the grant if it is still on its way; a refusal has nothing to give.
 */
export function releaseUnusedCall(call: Promise<VoiceCallStart>): void {
  void call
    .then((result) => (result.ok ? releaseVoiceCall({ data: { callId: result.callId } }) : null))
    .catch(() => {});
}
