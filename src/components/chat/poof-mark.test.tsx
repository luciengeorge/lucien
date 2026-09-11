import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { EXPRESSIONS, PoofMark } from "./poof-mark";

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

  it("keeps the three states distinguishable once motion is removed", () => {
    // Under prefers-reduced-motion the oscillation is dropped and only the pose remains.
    // jsdom never runs motion's frame loop, so this pins the claim at the data level: the
    // three poses must differ, or the state is illegible for anyone with motion turned off.
    const states = ["thinking", "working", "writing"] as const;
    const pairs = [
      [states[0], states[1]],
      [states[1], states[2]],
      [states[0], states[2]],
    ] as const;

    for (const [a, b] of pairs) {
      expect(EXPRESSIONS[a].pose.eyes).not.toEqual(EXPRESSIONS[b].pose.eyes);
      expect(EXPRESSIONS[a].pose.gaze).not.toEqual(EXPRESSIONS[b].pose.gaze);
    }
  });

  it("keeps what a state holds and what it does on separate layers", () => {
    // Poses are plain scalars so a state change eases into them. Oscillations are keyframe
    // arrays so a repeating loop never replays a scalar from identity and snaps back.
    for (const state of ["thinking", "working", "writing"] as const) {
      const { oscillation, pose } = EXPRESSIONS[state];
      for (const value of [...Object.values(pose.eyes), ...Object.values(pose.figure), ...Object.values(pose.gaze)]) {
        expect(typeof value).toBe("number");
      }
      for (const layer of [oscillation.eyes, oscillation.figure, oscillation.gaze]) {
        for (const [property, value] of Object.entries(layer.moving)) {
          expect(Array.isArray(value)).toBe(true);
          if (!Array.isArray(value)) continue;
          // Anything a state holds belongs in `pose`, where it eases. A loop that is anchored
          // off identity is a held offset in the wrong layer, and it cold-starts with a cut.
          const identity = property.startsWith("scale") ? 1 : 0;
          expect(value[0]).toBe(identity);
          expect(value[value.length - 1]).toBe(identity);
        }
      }
    }
  });
});
