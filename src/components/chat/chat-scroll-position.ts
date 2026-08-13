export interface TranscriptScrollBehaviour {
  /** Whether the pane should follow content as it arrives. */
  autoScroll: boolean;
  /** Where the pane sits when it first mounts. */
  defaultScrollPosition: "end" | "start";
}

/**
 * A conversation you are resuming should open where you left it and follow the
 * reply as it streams. A first visit should open at the beginning of what the
 * page has to say and stay there.
 *
 * Both properties are gated on the same question - has the visitor said
 * anything yet - because setting the mount position alone does not hold.
 * `autoScroll` re-pins the pane to the bottom whenever content arrives after
 * mount, and on a fresh load that content is the intro itself. Measured on
 * production at 390x844 the pane opened at scrollTop 199 of 710, so the first
 * words read were "Beirut and fluent in English, French, and Arabic"; gating
 * only the mount position moved it to 432, which is worse.
 */
export function transcriptScrollBehaviour(messages: ReadonlyArray<{ role: string }>): TranscriptScrollBehaviour {
  const hasVisitorSpoken = messages.some((message) => message.role === "user");

  return {
    autoScroll: hasVisitorSpoken,
    defaultScrollPosition: hasVisitorSpoken ? "end" : "start",
  };
}
