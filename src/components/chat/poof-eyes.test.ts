import { describe, expect, it } from "vitest";

import { EYES, eyePath, mixEye, withLid } from "./poof-eyes";

function numbers(path: string): number[] {
  return (path.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
}

describe("eye geometry", () => {
  it("draws every named shape as one closed path with finite coordinates", () => {
    for (const shape of Object.values(EYES)) {
      const d = eyePath(shape, 18.5, 24, "left");
      expect(d.startsWith("M")).toBe(true);
      expect(d.endsWith("Z")).toBe(true);
      expect(numbers(d).every(Number.isFinite)).toBe(true);
    }
  });

  it("morphs by blending the numbers, so both ends of a morph are the shapes themselves", () => {
    expect(mixEye(EYES.open, EYES.happy, 0)).toEqual(EYES.open);
    expect(mixEye(EYES.open, EYES.happy, 1)).toEqual(EYES.happy);
    expect(mixEye(EYES.open, EYES.happy, 0.5).w).toBeCloseTo((EYES.open.w + EYES.happy.w) / 2);
  });

  it("closes to a visible line on a blink instead of vanishing", () => {
    const shut = withLid(EYES.open, 0);
    expect(shut.top + shut.bottom).toBeGreaterThan(0.5);
    expect(shut.top + shut.bottom).toBeLessThan(1.5);
  });

  it("mirrors tilt, so a worried face raises both inner corners", () => {
    const left = numbers(eyePath(EYES.sad, 18.5, 24, "left"));
    const right = numbers(eyePath(EYES.sad, 29.5, 24, "right"));
    // Path starts at the outer-left point; for the left eye the inner corner is the right end.
    const [leftOuterX, leftOuterY] = left;
    const leftInnerY = left[7];
    const rightOuterY = right[7];
    const rightInnerY = right[1];
    expect(leftOuterX).toBeLessThan(18.5);
    expect(leftInnerY).toBeLessThan(leftOuterY);
    expect(rightInnerY).toBeLessThan(rightOuterY);
  });
});
