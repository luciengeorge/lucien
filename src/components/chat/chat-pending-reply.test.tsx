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
});
