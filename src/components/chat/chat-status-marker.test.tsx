import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ChatSystemNote, PoofStatus } from "./chat-status-marker";

afterEach(() => {
  cleanup();
});

describe("PoofStatus", () => {
  it("shimmers the label with no spinner, because the face beside it is the spinner", () => {
    const { container } = render(<PoofStatus label="Thinking…" />);

    expect(screen.getByText("Thinking…").getAttribute("data-slot")).toBe("shimmering-text");
    expect(screen.getByRole("status").textContent).toBe("Thinking…");
    expect(container.querySelector("svg.animate-spin")).toBeNull();
  });
});

describe("ChatSystemNote", () => {
  it("is a small centered line between the bubbles", () => {
    render(<ChatSystemNote>Your call is still saving.</ChatSystemNote>);

    const note = screen.getByRole("status");
    expect(note.textContent).toBe("Your call is still saving.");
    expect(note.className).toContain("text-center");
    expect(note.className).toContain("text-xs");
  });

  it("shimmers while the thing it describes is still happening", () => {
    render(<ChatSystemNote busy>Saving your call…</ChatSystemNote>);

    expect(screen.getByText("Saving your call…").getAttribute("data-slot")).toBe("shimmering-text");
  });
});
