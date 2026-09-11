import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ChatPendingReply } from "./chat-pending-reply";

afterEach(() => {
  cleanup();
});

describe("ChatPendingReply", () => {
  it("shows Poof thinking, with the label still carrying the status for screen readers", () => {
    const { container } = render(<ChatPendingReply isFirst />);

    expect(container.querySelector('[data-slot="poof-mark"]')?.getAttribute("data-state")).toBe("thinking");
    expect(screen.getByText("Thinking…")).not.toBeNull();
  });

  it("is the one place the face plays its entrance, because nothing was on screen before it", () => {
    const { container } = render(<ChatPendingReply isFirst />);

    expect(container.querySelector('[data-slot="poof-mark"]')?.getAttribute("style") ?? "").toContain("opacity: 0");
  });
});
