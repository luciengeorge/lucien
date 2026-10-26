import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MotionConfig } from "motion/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { restFrame } from "./poof-engine";
import { eyePath } from "./poof-eyes";
import { PoofMark } from "./poof-mark";
import { createPoofSignals, PoofSignalsContext } from "./poof-signals";

afterEach(() => {
  cleanup();
});

function mark(container: HTMLElement): Element | null {
  return container.querySelector('[data-slot="poof-mark"]');
}

function eyes(container: HTMLElement): (string | null)[] {
  return [...container.querySelectorAll('[data-slot="poof-mark-eye"]')].map((eye) => eye.getAttribute("d"));
}

describe("PoofMark", () => {
  it("is decorative, so the adjacent status text is the only thing announced", () => {
    const { container } = render(<PoofMark state="thinking" />);

    expect(mark(container)?.getAttribute("aria-hidden")).toBe("true");
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("exposes the state it is expressing", () => {
    for (const state of ["idle", "thinking", "working", "writing", "confused", "listening", "talking"] as const) {
      const { container } = render(<PoofMark state={state} />);
      expect(mark(container)?.getAttribute("data-state")).toBe(state);
      cleanup();
    }
  });

  it("is a face: one body and two eyes, with its sparkles hidden until something happens", () => {
    const { container } = render(<PoofMark state="writing" />);

    expect(container.querySelectorAll('[data-slot="poof-mark-body"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-slot="poof-mark-eye"]')).toHaveLength(2);
    for (const particle of container.querySelectorAll('[data-slot="poof-mark-particle"]')) {
      expect(particle.getAttribute("opacity")).toBe("0");
    }
  });

  it("server-renders the state's resting face, so the first paint is already in pose", () => {
    const { container } = render(<PoofMark state="writing" />);
    const frame = restFrame("writing");

    expect(eyes(container)).toEqual([
      eyePath(frame.eyes[0], 18.5, 24, "left"),
      eyePath(frame.eyes[1], 29.5, 24, "right"),
    ]);
  });

  it("shows the resting face for each state when motion is reduced", () => {
    const { container, rerender } = render(
      <MotionConfig reducedMotion="always">
        <PoofMark state="idle" />
      </MotionConfig>,
    );

    rerender(
      <MotionConfig reducedMotion="always">
        <PoofMark state="thinking" />
      </MotionConfig>,
    );
    const frame = restFrame("thinking");
    expect(eyes(container)).toEqual([
      eyePath(frame.eyes[0], 18.5, 24, "left"),
      eyePath(frame.eyes[1], 29.5, 24, "right"),
    ]);
    expect(container.querySelector('[data-slot="poof-mark-gaze"]')?.getAttribute("transform")).toBe(
      `translate(${frame.gaze.x} ${frame.gaze.y})`,
    );
  });

  it("is pleased to be poked", () => {
    const { container } = render(<PoofMark state="thinking" />);
    const svg = mark(container);
    if (!svg) throw new Error("no mark");

    fireEvent.pointerDown(svg);
    expect(svg.getAttribute("data-mood")).toBe("happy");
  });

  it("reacts to the composer through the signals it is given", () => {
    const signals = createPoofSignals();
    const { container } = render(
      <PoofSignalsContext value={signals}>
        <PoofMark state="idle" />
      </PoofSignalsContext>,
    );

    signals.emit("typing");
    expect(mark(container)?.getAttribute("data-mood")).toBe("listening");
  });

  it("follows a call's levels frame by frame", async () => {
    const levels = vi.fn(() => ({ input: 0, output: 0.8 }));
    render(<PoofMark levels={levels} state="talking" />);

    await waitFor(() => expect(levels.mock.calls.length).toBeGreaterThan(2));
  });

  it("does not pulse with the call when motion is reduced", async () => {
    const levels = vi.fn(() => ({ input: 0, output: 0.8 }));
    const { container } = render(
      <MotionConfig reducedMotion="always">
        <PoofMark levels={levels} state="talking" />
      </MotionConfig>,
    );

    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(levels).not.toHaveBeenCalled();
    expect(container.querySelector('[data-slot="poof-mark-figure"]')?.getAttribute("transform")).toContain(
      `scale(${restFrame("talking").body.scaleX} ${restFrame("talking").body.scaleY})`,
    );
  });
});
