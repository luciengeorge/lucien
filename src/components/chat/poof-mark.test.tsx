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

  it("renders two eyes so it reads as a face", () => {
    const { container } = render(<PoofMark state="writing" />);

    expect(container.querySelectorAll('[data-slot="poof-mark-eye"]')).toHaveLength(2);
  });

  it("depicts the job it is doing, not just a mood", () => {
    const cases = [
      { expected: "thinking", props: { state: "thinking" } },
      { expected: "writing", props: { state: "writing" } },
      { expected: "finding", props: { state: "working", tool: "link_work_entry" } },
      { expected: "fetching", props: { state: "working", tool: "download_resume" } },
      { expected: "sending", props: { state: "working", tool: "contact_lucien" } },
    ] as const;

    for (const { expected, props } of cases) {
      const { container } = render(<PoofMark {...props} />);
      expect(mark(container)?.getAttribute("data-depiction")).toBe(expected);
      expect(container.querySelector(`[data-slot="poof-mark-prop"][data-prop="${expected}"]`)).not.toBeNull();
      cleanup();
    }
  });

  it("falls back to searching when a tool call has no dedicated depiction", () => {
    const { container } = render(<PoofMark state="working" />);

    expect(mark(container)?.getAttribute("data-depiction")).toBe("finding");
  });

  it("keeps the prop under reduced motion, so the state stays legible without animation", () => {
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
      const { container } = render(<PoofMark state="working" tool="download_resume" />);
      expect(container.querySelector('[data-slot="poof-mark-prop"][data-prop="fetching"]')).not.toBeNull();
    } finally {
      globalThis.matchMedia = original;
    }
  });
});
