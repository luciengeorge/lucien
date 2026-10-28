import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MotionConfig } from "motion/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PEER_SCALE, restFrame } from "./poof-engine";
import { eyePath } from "./poof-eyes";
import { PoofMark } from "./poof-mark";
import { createPoofSignals, PoofSignalsContext } from "./poof-signals";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
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

  it("is already peering when it takes over a reply that is still thinking, from its very first paint", () => {
    expect(renderToString(<PoofMark entrance={false} state="thinking" />)).toContain(
      `scale(${PEER_SCALE} ${PEER_SCALE})`,
    );
  });

  it("holds its resting face still when motion is reduced: no glances, no peering, no sway", async () => {
    const { container } = render(
      <MotionConfig reducedMotion="always">
        <PoofMark entrance={false} state="thinking" />
      </MotionConfig>,
    );
    const figure = () => container.querySelector('[data-slot="poof-mark-figure"]')?.getAttribute("transform");
    const gaze = () => container.querySelector('[data-slot="poof-mark-gaze"]')?.getAttribute("transform");
    const before = [figure(), gaze(), ...eyes(container)];

    await new Promise((resolve) => setTimeout(resolve, 120));
    expect([figure(), gaze(), ...eyes(container)]).toEqual(before);
    expect(figure()).toContain("scale(1 1)");
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

  it("takes on the mood it is given, and starts out neutral", () => {
    const { container, rerender } = render(<PoofMark state="writing" />);
    expect(mark(container)?.getAttribute("data-feeling")).toBe("neutral");

    rerender(<PoofMark mood={{ mood: "sheepish" }} state="writing" />);
    expect(mark(container)?.getAttribute("data-feeling")).toBe("sheepish");
  });

  it("blushes when it is sheepish", async () => {
    const { container } = render(<PoofMark mood={{ mood: "sheepish" }} state="writing" />);
    const cheeks = container.querySelectorAll('[data-slot="poof-mark-cheek"]');
    expect(cheeks).toHaveLength(2);
    await waitFor(() => expect(Number(cheeks[0]?.getAttribute("opacity"))).toBeGreaterThan(0));
  });

  it("holds a mood as a still face when motion is reduced, then lets it go", () => {
    vi.useFakeTimers();
    const { container } = render(
      <MotionConfig reducedMotion="always">
        <PoofMark mood={{ mood: "proud" }} state="writing" />
      </MotionConfig>,
    );
    const proud = restFrame("writing", "proud");
    expect(eyes(container)).toEqual([
      eyePath(proud.eyes[0], 18.5, 24, "left"),
      eyePath(proud.eyes[1], 29.5, 24, "right"),
    ]);
    expect(container.querySelector('[data-slot="poof-mark-figure"]')?.getAttribute("transform")).toContain(
      `scale(${Math.round(proud.body.scaleX * 100) / 100} ${Math.round(proud.body.scaleY * 100) / 100})`,
    );

    act(() => {
      vi.advanceTimersByTime(6500);
    });
    const neutral = restFrame("writing");
    expect(eyes(container)).toEqual([
      eyePath(neutral.eyes[0], 18.5, 24, "left"),
      eyePath(neutral.eyes[1], 29.5, 24, "right"),
    ]);
  });
});
