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

  /*
   * Field Notes marked the unfinished stage with a dashed outline. Cedar has
   * nothing dashed anywhere, so the same distinction is carried by a lighter
   * ink weight instead: still exactly one box that reads as not-yet-solid.
   */
  it("marks the in-progress stage without dashing anything", () => {
    const { container } = render(<FyxerSequence />);

    // Motion writes its own stroke-dasharray while drawing, so only an authored
    // pattern counts as a dashed outline.
    expect(container.querySelectorAll('rect[stroke-dasharray="6 4"]').length).toBe(0);
    expect(container.querySelectorAll("rect.text-ink\\/35").length).toBe(1);
    expect(container.querySelectorAll("rect").length).toBe(3);
  });

  it("keeps the accent on the arrows and the annotation only", () => {
    const { container } = render(<FyxerSequence />);

    expect(container.querySelectorAll(".text-stamp").length).toBe(6);
    expect(container.querySelectorAll("rect.text-stamp").length).toBe(0);
  });
});
