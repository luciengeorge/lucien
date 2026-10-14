import { describe, expect, it } from "vitest";

import type { PoofFrame, PoofMood, PoofState } from "./poof-engine";

import { createPoofEngine, restFrame } from "./poof-engine";

const FPS = 60;
const STATES: PoofState[] = ["idle", "thinking", "working", "writing", "confused"];

function run(engine: ReturnType<typeof createPoofEngine>, seconds: number, each?: (frame: PoofFrame) => void) {
  let frame = engine.step(0);
  for (let i = 0; i < Math.round(seconds * FPS); i++) {
    frame = engine.step(1 / FPS);
    each?.(frame);
  }
  return frame;
}

function moods(engine: ReturnType<typeof createPoofEngine>, seconds: number): PoofMood[] {
  const seen: PoofMood[] = [];
  run(engine, seconds, (frame) => {
    if (seen.at(-1) !== frame.mood) seen.push(frame.mood);
  });
  return seen;
}

function eyeHeight(frame: PoofFrame): number {
  return frame.eyes[0].top + frame.eyes[0].bottom;
}

describe("Poof engine", () => {
  it("is deterministic for a seed, so tests and replays see the same face", () => {
    const a = createPoofEngine({ seed: 7, state: "idle" });
    const b = createPoofEngine({ seed: 7, state: "idle" });
    expect(run(a, 5)).toEqual(run(b, 5));
  });

  it("stays on the face whatever is thrown at it", () => {
    const engine = createPoofEngine({ seed: 3, state: "idle" });
    let n = 0;
    for (const state of [...STATES, ...STATES]) {
      engine.setState(state);
      engine.look({ x: n % 2 ? 300 : -40, y: n % 3 ? -200 : 60 });
      engine.signal(n % 2 ? "poke" : "typing");
      run(engine, 12, (frame) => {
        const values = [
          ...Object.values(frame.body),
          ...Object.values(frame.gaze),
          ...frame.eyes.flatMap((eye) => Object.values(eye)),
        ];
        expect(values.every(Number.isFinite)).toBe(true);
        expect(Math.abs(frame.gaze.x)).toBeLessThanOrEqual(4.5);
        expect(Math.abs(frame.gaze.y)).toBeLessThanOrEqual(4.5);
        expect(frame.body.scaleY).toBeGreaterThan(0.75);
        expect(frame.body.scaleY).toBeLessThan(1.3);
      });
      n++;
    }
  });

  it("holds together on a janky main thread, where frames arrive 50ms apart", () => {
    // Drowsy nods swing the lids hardest, so that is where a coarse step would blow up first.
    const engine = createPoofEngine({ seed: 14, state: "idle" });
    run(engine, 32);
    for (let i = 0; i < 2000; i++) {
      const frame = engine.step(0.05);
      const height = eyeHeight(frame);
      expect(Number.isFinite(height)).toBe(true);
      expect(height).toBeLessThan(14);
      expect(frame.eyes[0].top).toBeGreaterThan(-3);
    }
  });

  it("owes its greeting until it has said hello", () => {
    const engine = createPoofEngine({ greet: true, seed: 15, state: "idle" });
    expect(engine.owesGreeting()).toBe(true);
    run(engine, 1);
    expect(engine.owesGreeting()).toBe(false);
    expect(createPoofEngine({ seed: 15, state: "idle" }).owesGreeting()).toBe(false);
  });

  it("blinks on an irregular rhythm while idle", () => {
    const engine = createPoofEngine({ seed: 11, state: "idle" });
    const open = eyeHeight(restFrame("idle"));
    let blinks = 0;
    let shut = false;
    run(engine, 20, (frame) => {
      const isShut = eyeHeight(frame) < open * 0.3;
      if (isShut && !shut) blinks++;
      shut = isShut;
    });
    expect(blinks).toBeGreaterThanOrEqual(3);
    expect(blinks).toBeLessThanOrEqual(14);
  });

  it("looks toward the pointer while idle", () => {
    const right = createPoofEngine({ seed: 2, state: "idle" });
    right.look({ x: 120, y: 0 });
    expect(run(right, 0.8).gaze.x).toBeGreaterThan(1);

    const left = createPoofEngine({ seed: 2, state: "idle" });
    left.look({ x: -120, y: 0 });
    expect(run(left, 0.8).gaze.x).toBeLessThan(-1);
  });

  it("listens while the visitor types, then relaxes once they stop", () => {
    const engine = createPoofEngine({ seed: 4, state: "idle" });
    run(engine, 3);
    engine.signal("typing");
    expect(run(engine, 0.2).mood).toBe("listening");
    expect(run(engine, 4).mood).toBe("idle");
  });

  it("perks up when a reply starts, then settles into thinking", () => {
    const engine = createPoofEngine({ entrance: true, seed: 5, state: "thinking" });
    expect(moods(engine, 2)).toEqual(["surprised", "thinking"]);
  });

  it("is pleased when an answer lands, then goes back to idle", () => {
    const engine = createPoofEngine({ seed: 6, state: "writing" });
    run(engine, 2);
    engine.setState("idle");
    let sparkled = false;
    const seen: PoofMood[] = [];
    run(engine, 3, (frame) => {
      if (seen.at(-1) !== frame.mood) seen.push(frame.mood);
      sparkled ||= frame.particles.some((particle) => particle.kind === "spark" && particle.opacity > 0);
    });
    expect(seen).toEqual(["happy", "idle"]);
    expect(sparkled).toBe(true);
  });

  it("dozes off when nobody is around, and wakes up on any activity", () => {
    const engine = createPoofEngine({ seed: 8, state: "idle" });
    const asleep = moods(engine, 60);
    expect(asleep).toContain("drowsy");
    expect(asleep.at(-1)).toBe("sleeping");

    let dreaming = false;
    run(engine, 4, (frame) => {
      dreaming ||= frame.particles.some((particle) => particle.kind === "z" && particle.opacity > 0);
    });
    expect(dreaming).toBe(true);

    engine.signal("activity");
    expect(moods(engine, 3)).toEqual(["waking", "idle"]);
  });

  it("never dozes off while it has work to do", () => {
    for (const state of ["thinking", "working", "writing", "confused"] as const) {
      const engine = createPoofEngine({ seed: 9, state });
      expect(moods(engine, 90)).toEqual([state]);
    }
  });

  it("enjoys a poke, but gets annoyed when poked over and over", () => {
    const once = createPoofEngine({ seed: 10, state: "idle" });
    run(once, 1);
    once.signal("poke");
    expect(run(once, 0.1).mood).toBe("happy");

    const pestered = createPoofEngine({ seed: 10, state: "idle" });
    run(pestered, 1);
    for (let i = 0; i < 4; i++) {
      pestered.signal("poke");
      run(pestered, 0.25);
    }
    expect(run(pestered, 0.1).mood).toBe("annoyed");
  });

  it("says hello only when asked, so a remounted face does not greet again", () => {
    expect(moods(createPoofEngine({ greet: true, seed: 13, state: "idle" }), 3)).toEqual(["idle", "happy", "idle"]);
    expect(moods(createPoofEngine({ seed: 13, state: "idle" }), 3)).toEqual(["idle"]);
  });

  it("looks unsure of itself when something went wrong", () => {
    const frame = run(createPoofEngine({ seed: 12, state: "confused" }), 1);
    expect(frame.eyes[0]).not.toEqual(frame.eyes[1]);
  });
});

describe("Poof rest frames", () => {
  it("keeps every state legible with motion turned off", () => {
    for (const a of STATES) {
      for (const b of STATES) {
        if (a === b) continue;
        const fa = restFrame(a);
        const fb = restFrame(b);
        expect([fa.eyes, fa.gaze, fa.body]).not.toEqual([fb.eyes, fb.gaze, fb.body]);
      }
    }
  });

  it("is where a fresh face starts, so a mount lands in pose rather than easing into it", () => {
    for (const state of STATES) {
      const first = createPoofEngine({ seed: 1, state }).step(0);
      expect(first.gaze).toEqual(restFrame(state).gaze);
      expect(first.eyes).toEqual(restFrame(state).eyes);
    }
  });
});
