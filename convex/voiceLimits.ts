/** Voice is billed per second, so every limit on it lives here. Free of imports so the agent sync can share it. */
export const VOICE_LIMITS = {
  /** The voice agent's own max_duration_seconds: the longest any call can run, whatever it was granted. */
  callMaxSecs: 300,
  /** Seconds one visitor (session) may talk per UTC day. */
  visitorDailySecs: 300,
  /** Seconds all visitors together may talk per UTC calendar month. */
  globalMonthlySecs: 4500,
  /** A grant shorter than this is not worth starting a call for. */
  minGrantSecs: 30,
  /** How soon after reserving a call the browser may hand it back unused, when it never connected. */
  releaseWindowSecs: 90,
  /** The contact form opens from a call, so it only sends for a session with a call this recent. */
  contactAfterCallSecs: 15 * 60,
  /** Contact messages one session, and separately one IP, may send per day from the form. */
  contactDailyMessages: 3,
  /** How long voice rests after ElevenLabs refuses our account (no credit, key limit, bad key). */
  outageSecs: 60 * 60,
  /** Calls one IP may start per day. */
  ipDailyCalls: 6,
  /** An active call this long past the call cap never reported its end; it stops blocking new calls. */
  staleAfterMs: 10 * 60_000,
};

/**
 * A 4xx from ElevenLabs' token endpoint is about our account, not the request: no credit left, the
 * key's limit reached, or the key revoked. Every call would fail the same way, so voice rests for a
 * while. 429 is a rate limit and passes on its own, like a 5xx.
 */
export function isAccountRefusal(status: number) {
  return status >= 400 && status < 500 && status !== 429;
}
