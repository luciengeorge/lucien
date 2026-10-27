import type { StartVoiceCallResult } from "#/lib/functions/start-voice-call";

import { releaseVoiceCall } from "#/lib/functions/release-voice-call";
import { checkVoiceResting, startVoiceCall } from "#/lib/functions/start-voice-call";

export type VoiceRefusal =
  | Extract<StartVoiceCallResult, { ok: false }>["reason"]
  | "connect_failed"
  | "mic_blocked_system"
  | "mic_busy"
  | "mic_denied"
  | "mic_missing";

export type VoiceCallStart = Extract<StartVoiceCallResult, { ok: true }> | { ok: false; reason: VoiceRefusal };

export function isVoiceEnabled(): boolean {
  return import.meta.env.VITE_VOICE_ENABLED === "true";
}

export function microphoneRefusal(error: unknown): VoiceRefusal | null {
  if (!(error instanceof DOMException)) return null;
  // Chrome's wording when macOS or Windows privacy settings block the browser itself.
  if (error.name === "NotAllowedError" && /system/i.test(error.message)) return "mic_blocked_system";
  if (error.name === "NotAllowedError" || error.name === "SecurityError") return "mic_denied";
  if (error.name === "NotFoundError") return "mic_missing";
  if (error.name === "NotReadableError") return "mic_busy";
  return null;
}

/** Asks for the microphone and lets it go again: the SDK opens its own stream once the call connects. */
async function requestMicrophone(): Promise<"granted" | VoiceRefusal> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return "unavailable";
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    for (const track of stream.getTracks()) track.stop();
    return "granted";
  } catch (error) {
    return microphoneRefusal(error) ?? "unavailable";
  }
}

/**
 * Whether voice is resting first, so nobody grants the microphone only to be turned away. Then the
 * microphone: a visitor who blocks it should not spend a call from their daily allowance.
 */
export async function requestVoiceCall(): Promise<VoiceCallStart> {
  try {
    if (await checkVoiceResting()) return { ok: false, reason: "resting" };
  } catch {
    // Unknown is not resting: the call itself checks again.
  }
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
