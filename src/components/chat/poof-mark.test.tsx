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
    // Under prefers-reduced-motion every loop collapses to its `rest` frame. jsdom never
    // runs motion's frame loop, so this pins the claim at the data level: the three resting
    // frames must differ, or the state is illegible for anyone who has motion turned off.
    const states = ["thinking", "working", "writing"] as const;
    const pairs = [
      [states[0], states[1]],
      [states[1], states[2]],
      [states[0], states[2]],
    ] as const;

    for (const [a, b] of pairs) {
      expect(EXPRESSIONS[a].eyes.rest).not.toEqual(EXPRESSIONS[b].eyes.rest);
      expect(EXPRESSIONS[a].gaze.rest).not.toEqual(EXPRESSIONS[b].gaze.rest);
    }
    // And the figure holds a pose, not a snapshot mid-loop: every moving value is a keyframe
    // array, so a repeating transition never replays a scalar from identity.
    for (const state of states) {
      for (const track of [EXPRESSIONS[state].figure, EXPRESSIONS[state].gaze, EXPRESSIONS[state].eyes]) {
        for (const value of Object.values(track.moving)) {
          expect(Array.isArray(value)).toBe(true);
        }
      }
    }
  });
});
