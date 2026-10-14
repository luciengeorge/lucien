import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ChatSendFailed } from "./chat-send-failed";

afterEach(() => {
  cleanup();
});

describe("ChatSendFailed", () => {
  it("shows Poof confused when no answer is on screen to carry the face", () => {
    const { container } = render(<ChatSendFailed onRetry={vi.fn()} withPoof />);

    expect(container.querySelector('[data-slot="poof-mark"]')?.getAttribute("data-state")).toBe("confused");
  });

  it("leaves the face to the answer above when there is one", () => {
    const { container } = render(<ChatSendFailed onRetry={vi.fn()} />);

    expect(container.querySelector('[data-slot="poof-mark"]')).toBeNull();
  });
});
