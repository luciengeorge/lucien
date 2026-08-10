import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ChatTurnLabel } from "./chat-turn-label";

afterEach(() => {
  cleanup();
});

describe("ChatTurnLabel", () => {
  it("attributes his turns to him and yours to you", () => {
    render(<ChatTurnLabel role="assistant" />);
    expect(screen.getByText("LUCIEN")).toBeTruthy();

    cleanup();

    render(<ChatTurnLabel role="user" />);
    expect(screen.getByText("YOU")).toBeTruthy();
  });

  /*
   * A ledger numbers its lines because you need to cite them. Nobody cites a
   * turn in a conversation, so a number here bought nothing and cost a second
   * line read aloud beside every single turn.
   */
  it("does not number the turns", () => {
    render(<ChatTurnLabel role="assistant" />);

    expect(screen.queryByText(/ENTRY/)).toBeNull();
  });

  it("says so while he is still writing", () => {
    render(<ChatTurnLabel isWriting role="assistant" />);

    expect(screen.getByText("WRITING")).toBeTruthy();
  });

  it("keeps the live dot out of the accessibility tree, because the word beside it says it", () => {
    const { container } = render(<ChatTurnLabel isWriting role="assistant" />);

    const dot = container.querySelector("[data-slot='writing-dot']");
    expect(dot).toBeTruthy();
    expect(dot?.getAttribute("aria-hidden")).toBe("true");
  });

  it("says nothing but the speaker on a settled turn", () => {
    const { container } = render(<ChatTurnLabel role="assistant" />);

    expect(container.querySelector("[data-slot='writing-dot']")).toBeNull();
    expect(container.textContent).toBe("LUCIEN");
  });
});
