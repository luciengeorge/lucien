import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PoofMark } from "./poof-mark";

afterEach(() => {
  cleanup();
});

describe("PoofMark", () => {
  it("is decorative, so the adjacent status text is the only thing announced", () => {
    const { container } = render(<PoofMark state="thinking" />);

    const mark = container.querySelector('[data-slot="poof-mark"]');
    expect(mark).not.toBeNull();
    expect(mark?.getAttribute("aria-hidden")).toBe("true");
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("exposes the state it is expressing", () => {
    for (const state of ["thinking", "working", "speaking"] as const) {
      const { container } = render(<PoofMark state={state} />);
      expect(container.querySelector('[data-slot="poof-mark"]')?.getAttribute("data-state")).toBe(state);
      cleanup();
    }
  });

  it("renders two eyes so it reads as a face at label size", () => {
    const { container } = render(<PoofMark state="speaking" />);

    expect(container.querySelectorAll('[data-slot="poof-mark-eye"]')).toHaveLength(2);
  });
});
