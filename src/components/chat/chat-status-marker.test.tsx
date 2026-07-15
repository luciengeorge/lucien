import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ChatStatusMarker } from "./chat-status-marker";

afterEach(() => {
  cleanup();
});

describe("ChatStatusMarker", () => {
  it("renders the label via the ShimmeringText component with a spinner", () => {
    const { container } = render(<ChatStatusMarker label="Thinking…" />);

    const label = screen.getByText("Thinking…");
    expect(label.getAttribute("data-slot")).toBe("shimmering-text");
    expect(container.querySelector("svg.animate-spin")).not.toBeNull();
  });
});
