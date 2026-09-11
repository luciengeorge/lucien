import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PoofMark } from "./poof-mark";

afterEach(() => {
  cleanup();
});

function mark(container: HTMLElement): Element | null {
  return container.querySelector('[data-slot="poof-mark"]');
}

describe("PoofMark", () => {
  it("is decorative, so the adjacent status text is the only thing announced", () => {
    const { container } = render(<PoofMark state="thinking" />);

    expect(mark(container)?.getAttribute("aria-hidden")).toBe("true");
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("exposes the state it is expressing", () => {
    for (const state of ["thinking", "working", "writing"] as const) {
      const { container } = render(<PoofMark state={state} />);
      expect(mark(container)?.getAttribute("data-state")).toBe(state);
      cleanup();
    }
  });

  it("is a face: one body and two eyes, and nothing else", () => {
    const { container } = render(<PoofMark state="writing" />);

    expect(container.querySelectorAll('[data-slot="poof-mark-body"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-slot="poof-mark-eye"]')).toHaveLength(2);
    expect(container.querySelector('[data-slot="poof-mark-prop"]')).toBeNull();
  });

  it("still renders every state under reduced motion", () => {
    const original = globalThis.matchMedia;
    globalThis.matchMedia = (query: string): MediaQueryList => ({
      addEventListener: () => {},
      addListener: () => {},
      dispatchEvent: () => false,
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      removeEventListener: () => {},
      removeListener: () => {},
    });

    try {
      for (const state of ["thinking", "working", "writing"] as const) {
        const { container } = render(<PoofMark state={state} />);
        expect(mark(container)?.getAttribute("data-state")).toBe(state);
        expect(container.querySelectorAll('[data-slot="poof-mark-eye"]')).toHaveLength(2);
        cleanup();
      }
    } finally {
      globalThis.matchMedia = original;
    }
  });
});
