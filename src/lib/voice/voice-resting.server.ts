import { fetchAuthQuery } from "#/lib/auth-server";

import { api } from "../../../convex/_generated/api";

/** Whether ElevenLabs refused our account recently. Unreadable reads as available: the call checks again. */
export async function isVoiceResting(): Promise<boolean> {
  try {
    return await fetchAuthQuery(api.voiceOutages.isVoiceResting, {});
  } catch {
    return false;
  }
}

/** For the chat state a page loads with, so the voice button can grey out before anyone clicks it. */
export async function voiceRestingForPage(): Promise<boolean> {
  if (import.meta.env.VITE_VOICE_ENABLED !== "true") return false;
  return isVoiceResting();
}
