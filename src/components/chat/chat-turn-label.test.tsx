import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ChatTurnLabel, entryNumeral } from "./chat-turn-label";

afterEach(() => {
  cleanup();
});

describe("entryNumeral", () => {
  it("zero-pads the position, so the label lane never changes width", () => {
    expect(entryNumeral(0)).toBe("ENTRY 01");
    expect(entryNumeral(9)).toBe("ENTRY 10");
  });
});

describe("ChatTurnLabel", () => {
  it("attributes his turns to him and yours to you", () => {
    render(<ChatTurnLabel entryIndex={0} role="assistant" />);
    expect(screen.getByText("LUCIEN")).toBeTruthy();

    cleanup();

    render(<ChatTurnLabel entryIndex={1} role="user" />);
    expect(screen.getByText("YOU")).toBeTruthy();
  });

  it("numbers each turn as an entry in the transcript", () => {
    render(<ChatTurnLabel entryIndex={2} role="assistant" />);

    expect(screen.getByText("ENTRY 03")).toBeTruthy();
  });

  it("replaces the number with a live marker while he is still writing", () => {
    render(<ChatTurnLabel entryIndex={0} isWriting role="assistant" />);

    expect(screen.getByText("WRITING")).toBeTruthy();
    expect(screen.queryByText("ENTRY 01")).toBeNull();
  });

  it("keeps the live dot out of the accessibility tree, because the word beside it says it", () => {
    const { container } = render(<ChatTurnLabel entryIndex={0} isWriting role="assistant" />);

    const dot = container.querySelector("[data-slot='writing-dot']");
    expect(dot).toBeTruthy();
    expect(dot?.getAttribute("aria-hidden")).toBe("true");
  });

  it("does not mark a settled turn as live", () => {
    const { container } = render(<ChatTurnLabel entryIndex={0} role="assistant" />);

    expect(container.querySelector("[data-slot='writing-dot']")).toBeNull();
  });
});
