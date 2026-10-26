import { useEffect, useState } from "react";

/** Longer than the gaps between the agent's sentences, short enough that listening still feels prompt. */
export const AGENT_QUIET_MS = 700;

/**
 * The SDK reports "listening" in every short gap of the agent's audio, so the face and status flickered
 * mid-answer. Talking starts at once; listening waits until the agent has been quiet for a moment.
 */
export function useSettledSpeaking(isSpeaking: boolean): boolean {
  const [settled, setSettled] = useState(isSpeaking);
  if (isSpeaking && !settled) setSettled(true);

  useEffect(() => {
    if (isSpeaking) return;
    const timer = setTimeout(() => setSettled(false), AGENT_QUIET_MS);
    return () => clearTimeout(timer);
  }, [isSpeaking]);

  return isSpeaking || settled;
}
