import { MOODS } from "#/lib/chat/mood";
import { describe, expect, it } from "vitest";

import type { PoofFrame, PoofMood, PoofState } from "./poof-engine";

import { createPoofEngine, GAZE_LIMIT, PEER_SCALE, pickGlance, restFrame } from "./poof-engine";
import { EYES } from "./poof-eyes";

const FPS = 60;
const STATES: PoofState[] = ["idle", "thinking", "working", "writing", "confused", "listening", "talking"];

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
        expect(Math.abs(frame.gaze.x)).toBeLessThanOrEqual(GAZE_LIMIT.x);
        expect(Math.abs(frame.gaze.y)).toBeLessThanOrEqual(GAZE_LIMIT.y);
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

  it("is startled rather than pleased when the visitor stops it mid-answer", () => {
    const engine = createPoofEngine({ seed: 6, state: "writing" });
    run(engine, 2);
    engine.setState("idle", { interrupted: true });
    let sparkled = false;
    const seen: PoofMood[] = [];
    run(engine, 3, (frame) => {
      if (seen.at(-1) !== frame.mood) seen.push(frame.mood);
      sparkled ||= frame.particles.some((particle) => particle.kind === "spark" && particle.opacity > 0);
    });
    expect(seen).toEqual(["surprised", "idle"]);
    expect(sparkled).toBe(false);
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
    for (const state of ["thinking", "working", "writing", "confused", "listening", "talking"] as const) {
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

describe("Poof on a voice call", () => {
  function tallest(state: PoofState, levels?: { input: number; output: number }) {
    const engine = createPoofEngine({ seed: 21, state });
    let max = 0;
    run(engine, 0.5);
    if (levels) engine.hear(levels);
    run(engine, 2, (frame) => {
      max = Math.max(max, frame.body.scaleY);
    });
    return max;
  }

  it("swells with its own voice while it talks", () => {
    expect(tallest("talking", { input: 0, output: 1 })).toBeGreaterThan(tallest("talking") + 0.04);
  });

  it("answers the visitor's voice more lightly while it listens", () => {
    const swell = tallest("listening", { input: 1, output: 0 }) - tallest("listening");
    expect(swell).toBeGreaterThan(0.01);
    expect(swell).toBeLessThan(tallest("talking", { input: 0, output: 1 }) - tallest("talking"));
  });

  it("ignores sound when it is not on a call", () => {
    const deaf = createPoofEngine({ seed: 22, state: "writing" });
    deaf.hear({ input: 1, output: 1 });
    expect(run(deaf, 2)).toEqual(run(createPoofEngine({ seed: 22, state: "writing" }), 2));
  });

  it("stays on the face whatever levels it is fed", () => {
    const engine = createPoofEngine({ seed: 23, state: "talking" });
    engine.hear({ input: 50, output: -3 });
    run(engine, 3, (frame) => {
      expect(Object.values(frame.body).every(Number.isFinite)).toBe(true);
      expect(frame.body.scaleY).toBeLessThan(1.3);
    });
    engine.hear({ input: Number.NaN, output: Number.POSITIVE_INFINITY });
    expect(Object.values(run(engine, 1).body).every(Number.isFinite)).toBe(true);
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

describe("Poof's moods", () => {
  const FEELINGS = MOODS.filter((mood) => mood !== "neutral");

  function feeling(state: PoofState, mood: (typeof MOODS)[number], seed = 31) {
    const engine = createPoofEngine({ seed, state });
    run(engine, 1);
    engine.feel(mood);
    return engine;
  }

  /* Blinks squeeze an eye's height, so its width and tilt are what tell the shape. */
  function shape(frame: PoofFrame) {
    return frame.eyes.map((eye) => [Number(eye.w.toFixed(2)), Number(eye.tilt.toFixed(2))]);
  }

  it("shows each mood on its face, easing in rather than snapping", () => {
    for (const mood of FEELINGS) {
      const engine = feeling("writing", mood);
      const first = engine.step(1 / FPS);
      expect(first.feeling).toBe(mood);
      expect(shape(first)).not.toEqual(shape(restFrame("writing", mood)));
      const settled = run(engine, 1);
      expect(settled.feeling).toBe(mood);
      expect(shape(settled)).toEqual(shape(restFrame("writing", mood)));
    }
  });

  it("keeps swelling with its voice while it talks in a mood", () => {
    function tallest(levels: { input: number; output: number }) {
      const engine = feeling("talking", "excited", 41);
      engine.hear(levels);
      let max = 0;
      run(engine, 2, (frame) => {
        max = Math.max(max, frame.body.scaleY);
      });
      return max;
    }
    expect(tallest({ input: 0, output: 1 })).toBeGreaterThan(tallest({ input: 0, output: 0 }) + 0.04);
  });

  it("keeps answering the visitor's voice while it listens in a mood", () => {
    function tallest(levels: { input: number; output: number }) {
      const engine = feeling("listening", "curious", 42);
      engine.hear(levels);
      let max = 0;
      run(engine, 2, (frame) => {
        max = Math.max(max, frame.body.scaleY);
      });
      return max;
    }
    expect(tallest({ input: 1, output: 0 })).toBeGreaterThan(tallest({ input: 0, output: 0 }) + 0.01);
  });

  it("drifts back to neutral about six seconds after the last mood", () => {
    const engine = feeling("writing", "curious");
    expect(run(engine, 5).feeling).toBe("curious");
    const after = run(engine, 2.5);
    expect(after.feeling).toBe("neutral");
    expect(shape(after)).toEqual(shape(restFrame("writing")));
  });

  it("holds a mood for as long as it keeps being set", () => {
    const engine = feeling("writing", "proud");
    run(engine, 4);
    engine.feel("proud");
    expect(run(engine, 4.5).feeling).toBe("proud");
  });

  it("goes back to neutral early when told to", () => {
    const engine = feeling("writing", "sheepish");
    run(engine, 1);
    engine.feel("neutral");
    expect(run(engine, 1.5).feeling).toBe("neutral");
  });

  it("moves from one mood straight into the next", () => {
    const engine = feeling("idle", "happy");
    run(engine, 1);
    engine.feel("thoughtful");
    const frame = run(engine, 1);
    expect(frame.feeling).toBe("thoughtful");
    expect(shape(frame)).toEqual(shape(restFrame("idle", "thoughtful")));
  });

  it("blushes when it is sheepish, and only then", () => {
    for (const mood of FEELINGS) {
      const frame = run(feeling("idle", mood), 1);
      if (mood === "sheepish") expect(frame.blush).toBeGreaterThan(0.9);
      else expect(frame.blush).toBe(0);
    }
    expect(run(createPoofEngine({ seed: 1, state: "idle" }), 1).blush).toBe(0);
  });

  it("bounces and sparkles when excited", () => {
    function bounce(mood: (typeof MOODS)[number]) {
      const engine = feeling("writing", mood, 43);
      let low = Infinity;
      let high = -Infinity;
      let sparkled = false;
      run(engine, 3, (frame) => {
        low = Math.min(low, frame.body.y);
        high = Math.max(high, frame.body.y);
        sparkled ||= frame.particles.some((particle) => particle.kind === "spark" && particle.opacity > 0);
      });
      return { range: high - low, sparkled };
    }
    const excited = bounce("excited");
    expect(excited.sparkled).toBe(true);
    expect(excited.range).toBeGreaterThan(bounce("thoughtful").range + 0.8);
  });

  it("does not celebrate a landed answer it was sheepish about", () => {
    const engine = feeling("writing", "sheepish");
    run(engine, 1);
    engine.setState("idle");
    let sparkled = false;
    run(engine, 2, (frame) => {
      sparkled ||= frame.particles.some((particle) => particle.kind === "spark" && particle.opacity > 0);
    });
    expect(sparkled).toBe(false);
  });

  it("stays on the face whatever moods are thrown at it", () => {
    const engine = createPoofEngine({ seed: 44, state: "talking" });
    engine.hear({ input: 1, output: 1 });
    for (const mood of [...FEELINGS, ...FEELINGS]) {
      engine.feel(mood);
      run(engine, 0.7, (frame) => {
        expect(Object.values(frame.body).every(Number.isFinite)).toBe(true);
        expect(frame.body.scaleY).toBeGreaterThan(0.75);
        expect(frame.body.scaleY).toBeLessThan(1.3);
        expect(Math.abs(frame.gaze.x)).toBeLessThanOrEqual(GAZE_LIMIT.x);
        expect(Math.abs(frame.gaze.y)).toBeLessThanOrEqual(GAZE_LIMIT.y);
      });
    }
  });

  it("keeps every mood legible as a still face, for reduced motion", () => {
    for (const a of MOODS) {
      for (const b of MOODS) {
        if (a === b) continue;
        const fa = restFrame("idle", a);
        const fb = restFrame("idle", b);
        expect([fa.eyes, fa.gaze, fa.body]).not.toEqual([fb.eyes, fb.gaze, fb.body]);
      }
    }
    expect(restFrame("idle", "sheepish").blush).toBe(1);
    expect(restFrame("talking", "proud").feeling).toBe("proud");
  });
});

describe("Poof's glances", () => {
  const FACE = 34;

  function draws(state: Parameters<typeof pickGlance>[0], n = 400) {
    const rand = mulberry(99);
    let side = 1;
    return Array.from({ length: n }, () => {
      const glance = pickGlance(state, rand, side);
      if (!glance) throw new Error(`no glances for ${state}`);
      side = glance.side;
      return glance;
    });
  }

  function mulberry(seed: number) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const mean = (ns: number[]) => ns.reduce((sum, n) => sum + n, 0) / ns.length;

  it("holds each idle glance for 1.5 to 4 seconds", () => {
    for (const glance of draws("idle")) {
      expect(glance.hold).toBeGreaterThanOrEqual(1.5);
      expect(glance.hold).toBeLessThanOrEqual(4);
    }
  });

  it("looks clearly away when it glances, but never off the face", () => {
    const away = draws("idle").filter((glance) => glance.x !== 0);
    expect(away.length).toBeGreaterThan(200);
    for (const glance of away) {
      expect(Math.abs(glance.x) / FACE).toBeGreaterThanOrEqual(0.09);
      expect(Math.abs(glance.x) / FACE).toBeLessThanOrEqual(0.18);
    }
    for (const state of ["idle", "thinking", "working", "listening", "talking"] as const) {
      for (const glance of draws(state)) {
        expect(Math.abs(glance.x)).toBeLessThanOrEqual(GAZE_LIMIT.x);
        expect(Math.abs(glance.y)).toBeLessThanOrEqual(GAZE_LIMIT.y);
      }
    }
  });

  it("glances more often and upward while it thinks", () => {
    const idle = draws("idle");
    const thinking = draws("thinking");
    expect(mean(thinking.map((g) => g.hold))).toBeLessThan(mean(idle.map((g) => g.hold)) - 0.5);
    expect(mean(thinking.map((g) => g.y))).toBeLessThan(-2);
    expect(mean(draws("working").map((g) => g.hold))).toBeLessThan(mean(idle.map((g) => g.hold)) - 0.5);
  });

  it("swaps sides on every busy glance, so the slant can flip with it", () => {
    for (const state of ["thinking", "working"] as const) {
      const glances = draws(state, 40);
      for (let i = 1; i < glances.length; i++) expect(glances[i]?.side).toBe(-(glances[i - 1]?.side ?? 0));
    }
  });

  it("keeps its eyes mostly on the visitor while it listens, and glances least while it talks", () => {
    const listening = draws("listening");
    const near = listening.filter((g) => Math.abs(g.x - restFrame("listening").gaze.x) < 1.5);
    expect(near.length / listening.length).toBeGreaterThan(0.6);
    expect(mean(draws("talking").map((g) => g.hold))).toBeGreaterThan(mean(draws("idle").map((g) => g.hold)));
  });

  it("darts quickly to each idle glance, then holds still", () => {
    const engine = createPoofEngine({ seed: 17, state: "idle" });
    const xs: number[] = [];
    run(engine, 20, (frame) => xs.push(frame.gaze.x));
    const starts: number[] = [];
    let lastMoving = -Infinity;
    for (let i = 1; i < xs.length; i++) {
      if (Math.abs((xs[i] ?? 0) - (xs[i - 1] ?? 0)) <= 0.01) continue;
      if (i - lastMoving > 0.3 * FPS) starts.push(i);
      lastMoving = i;
    }
    expect(starts.length).toBeGreaterThanOrEqual(5);
    expect(starts.length).toBeLessThanOrEqual(14);
    for (let i = 0; i < starts.length - 1; i++) {
      const start = starts[i] ?? 0;
      const next = starts[i + 1] ?? 0;
      expect((next - start) / FPS).toBeGreaterThanOrEqual(1.4);
      const held = xs[next - 1] ?? 0;
      expect(Math.abs((xs[start + Math.round(0.26 * FPS)] ?? 0) - held)).toBeLessThan(0.15);
    }
    expect(Math.max(...xs.map(Math.abs))).toBeGreaterThan(3.2);
  });

  it("lets the pointer win over its own glances", () => {
    const engine = createPoofEngine({ seed: 18, state: "idle" });
    run(engine, 0.4);
    engine.look({ x: 120, y: 0 });
    run(engine, 0.3);
    for (let i = 0; i < 5; i++) {
      engine.look({ x: 120, y: 0 });
      run(engine, 1, (frame) => expect(frame.gaze.x).toBeGreaterThan(3));
    }
  });

  it("slants its eyes while it works, flipping the slant from glance to glance", () => {
    const engine = createPoofEngine({ seed: 19, state: "working" });
    const slants: number[] = [];
    run(engine, 8, (frame) => slants.push(frame.eyes[0].slant));
    expect(Math.max(...slants)).toBeGreaterThan(12);
    expect(Math.min(...slants)).toBeLessThan(-12);
    for (const frame of [run(createPoofEngine({ seed: 19, state: "idle" }), 3)]) {
      expect(frame.eyes[0].slant).toBe(0);
    }
  });

  it("morphs to a new eye shape in about a fifth of a second", () => {
    const engine = createPoofEngine({ seed: 20, state: "idle" });
    run(engine, 1);
    engine.setState("working");
    const settled = run(engine, 0.26);
    expect(settled.eyes[0].w).toBeCloseTo(EYES.pill.w, 1);
  });
});

describe("Poof's body moments", () => {
  function scales(engine: ReturnType<typeof createPoofEngine>, seconds: number) {
    const seen: number[] = [];
    run(engine, seconds, (frame) => seen.push(frame.body.scaleY));
    return seen;
  }

  it("shrinks to peer once it starts thinking about a question", () => {
    const engine = createPoofEngine({ entrance: true, seed: 24, state: "thinking" });
    const seen = scales(engine, 2);
    expect(seen.at(-1)).toBeLessThan(PEER_SCALE + 0.03);
    expect(seen.at(-1)).toBeGreaterThan(PEER_SCALE - 0.03);
    expect(Math.min(...seen)).toBeGreaterThan(PEER_SCALE - 0.03);
  });

  it("is already peering when it takes over from the face that started thinking", () => {
    const first = createPoofEngine({ seed: 25, state: "thinking" }).step(0);
    expect(first.body.scaleY).toBeCloseTo(PEER_SCALE, 2);
  });

  it("pops back past full size when the answer starts, then settles", () => {
    for (const next of ["writing", "talking"] as const) {
      const engine = createPoofEngine({ seed: 26, state: "thinking" });
      run(engine, 1.5);
      engine.setState(next);
      const seen = scales(engine, 0.6);
      expect(Math.max(...seen)).toBeGreaterThan(1.02);
      const after = scales(engine, 1.5);
      expect(Math.abs((after.at(-1) ?? 0) - restFrame(next).body.scaleY)).toBeLessThan(0.03);
    }
  });

  it("stays full size when it is not thinking", () => {
    for (const state of ["idle", "working", "writing", "listening", "talking"] as const) {
      // Working squats a little (squash), which is not the same as shrinking.
      const seen = scales(createPoofEngine({ seed: 27, state }), 3);
      expect(Math.min(...seen)).toBeGreaterThan(0.93);
    }
  });

  it("perks up when it starts talking on a call", () => {
    const engine = createPoofEngine({ seed: 28, state: "listening" });
    const before = Math.max(...scales(engine, 1.5));
    engine.setState("talking");
    expect(Math.max(...scales(engine, 0.5))).toBeGreaterThan(before + 0.02);
  });
});

describe("Poof's calm idle", () => {
  it("sways only a little while idle, so its glances stand out", () => {
    const engine = createPoofEngine({ seed: 29, state: "idle" });
    run(engine, 0.5);
    const rotations: number[] = [];
    const sizes: number[] = [];
    run(engine, 20, (frame) => {
      rotations.push(frame.body.rotate);
      sizes.push(frame.body.scaleY);
    });
    expect(Math.max(...rotations.map(Math.abs))).toBeLessThanOrEqual(1.6);
    expect(Math.max(...sizes)).toBeLessThanOrEqual(1.011);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(0.989);
  });
});
