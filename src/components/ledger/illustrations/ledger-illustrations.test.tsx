import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { FyxerSequence } from "./fyxer-sequence";

afterEach(() => {
  cleanup();
});

describe("FyxerSequence", () => {
  it("describes what was shipped rather than leaving it as an unlabelled diagram", () => {
    render(<FyxerSequence />);

    expect(screen.getByRole("img", { name: /chat, then the notetaker app, then B2B and enterprise/i })).toBeTruthy();
  });

  it("renders each thing shipped, in order", () => {
    render(<FyxerSequence />);

    expect(screen.getByText("Fyxer chat")).toBeTruthy();
    expect(screen.getByText("notetaker app")).toBeTruthy();
    expect(screen.getByText("B2B and enterprise")).toBeTruthy();
  });

  it("marks the unfinished stage at a lighter weight rather than with a dashed rule", () => {
    const { container } = render(<FyxerSequence />);

    expect(screen.getAllByText("in progress").length).toBe(1);

    const stages = Array.from(container.querySelectorAll("rect")).map((node) => node.getAttribute("class"));
    expect(stages).toEqual([null, null, "text-ink/35"]);

    // Matching the literal pattern rather than the bare attribute, because
    // Motion writes its own stroke-dasharray while drawing an undashed rect.
    expect(container.querySelectorAll('rect[stroke-dasharray="6 4"]').length).toBe(0);
  });
});
