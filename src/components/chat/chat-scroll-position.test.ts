import { describe, expect, it } from "vitest";

import { transcriptScrollBehaviour } from "./chat-scroll-position";

function assistant(text: string) {
  return { id: `a-${text}`, parts: [{ text, type: "text" as const }], role: "assistant" as const };
}

function user(text: string) {
  return { id: `u-${text}`, parts: [{ text, type: "text" as const }], role: "user" as const };
}

describe("transcriptScrollBehaviour", () => {
  /*
   * Measured on production at 390x844: the pane mounted at scrollTop 199 of
   * 710, so a first-time visitor on a phone landed on "Beirut and fluent in
   * English, French, and Arabic" and never saw the opening line.
   *
   * Setting the mount position alone was not enough. `autoScroll` re-pins the
   * pane to the bottom as content arrives after mount, which on a fresh load
   * is the intro itself streaming in - that measured *worse*, at scrollTop
   * 432. Both have to be gated on the same condition.
   */
  it("opens at the top and does not chase content when the visitor has not spoken", () => {
    expect(transcriptScrollBehaviour([])).toEqual({ autoScroll: false, defaultScrollPosition: "start" });
    expect(transcriptScrollBehaviour([assistant("Hi, I'm Poof.")])).toEqual({
      autoScroll: false,
      defaultScrollPosition: "start",
    });
  });

  it("opens at the bottom and follows new content once there is a conversation", () => {
    expect(transcriptScrollBehaviour([assistant("Hi"), user("What does he build?")])).toEqual({
      autoScroll: true,
      defaultScrollPosition: "end",
    });
  });

  it("keeps following a long resumed conversation", () => {
    const messages = [assistant("intro"), user("q1"), assistant("a1"), user("q2"), assistant("a2")];
    expect(transcriptScrollBehaviour(messages)).toEqual({ autoScroll: true, defaultScrollPosition: "end" });
  });

  it("treats a user message anywhere in the transcript as a live conversation", () => {
    expect(transcriptScrollBehaviour([user("q1"), assistant("a1")])).toEqual({
      autoScroll: true,
      defaultScrollPosition: "end",
    });
  });
});
