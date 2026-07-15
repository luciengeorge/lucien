import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ChatToolProgressChip } from "./chat-tool-progress-chip";

afterEach(() => {
  cleanup();
});

describe("ChatToolProgressChip", () => {
  it("renders the label via the ShimmeringText component with a spinner", () => {
    const { container } = render(<ChatToolProgressChip label="Finding the right work…" />);

    const label = screen.getByText("Finding the right work…");
    expect(label.getAttribute("data-slot")).toBe("shimmering-text");
    expect(container.querySelector("svg.animate-spin")).not.toBeNull();
  });
});
