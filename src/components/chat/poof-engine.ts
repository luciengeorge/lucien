import type { EyeName, EyeShape } from "./poof-eyes";

import { EYES, mixEye, withLid } from "./poof-eyes";

/** What the app tells Poof: what the conversation is doing right now. `listening` and `talking` are a voice call's turns. */
export type PoofState = "idle" | "thinking" | "working" | "writing" | "confused" | "listening" | "talking";

/**
 * What Poof is actually expressing. The app only sets the state; Poof layers its own life on
 * top: it listens while you type, is pleased when an answer lands, perks up when a reply starts,
 * dozes off when left alone, and reacts to being poked.
 */
export type PoofMood = PoofState | "happy" | "surprised" | "annoyed" | "drowsy" | "sleeping" | "waking";

export type PoofSignal = "typing" | "activity" | "poke";

export type PoofParticle = {
  kind: "spark" | "z";
  opacity: number;
  rotate: number;
  scale: number;
  x: number;
  y: number;
};

export type PoofFrame = {
  /** Applied around the bottom centre of the body, so Poof sways and squashes like it stands on something. */
  body: { rotate: number; scaleX: number; scaleY: number; x: number; y: number };
  eyes: [EyeShape, EyeShape];
  gaze: { x: number; y: number };
  mood: PoofMood;
  /** A fixed pool, in a fixed order, so a renderer can keep one element per slot. */
  particles: PoofParticle[];
};

/** Pointer position relative to the face centre, in viewBox units. */
export type PoofPoint = { x: number; y: number };

/** How loud each side of a voice call is right now, 0 to 1. */
export type PoofLevels = { input: number; output: number };

export const SPARK_COUNT = 10;
export const Z_COUNT = 3;

type Pose = {
  eyes: [EyeName, EyeName];
  gaze: { x: number; y: number };
  lid: number;
  rotate: number;
  scale: number;
  squash: number;
  x: number;
  y: number;
};

const pose = (eyes: [EyeName, EyeName], gaze: [number, number], body: Partial<Pose> = {}): Pose => ({
  eyes,
  gaze: { x: gaze[0], y: gaze[1] },
  lid: 1,
  rotate: 0,
  scale: 1,
  squash: 1,
  x: 0,
  y: 0,
  ...body,
});

/**
 * Where each mood rests. These are also the reduced-motion faces, so every app state must be
 * told apart from the others by its pose alone: thinking looks up with a cocked head, working
 * narrows its eyes, writing looks down at the page, confused is lopsided.
 */
const REST: Record<PoofMood, Pose> = {
  idle: pose(["open", "open"], [0, 0]),
  listening: pose(["wide", "wide"], [0.4, 3], { rotate: 7, scale: 1.03, y: -0.7 }),
  thinking: pose(["half", "half"], [0, -3.2], { rotate: -7, y: -0.5 }),
  working: pose(["focus", "focus"], [0, 0.5], { squash: 0.965, y: 0.8 }),
  writing: pose(["open", "open"], [0, 2.4], { y: 0.6 }),
  confused: pose(["doubt", "open"], [2, -2.4], { rotate: 9 }),
  happy: pose(["happy", "happy"], [0, -0.6], { scale: 1.04 }),
  surprised: pose(["wide", "wide"], [0, -0.6], { y: -0.8 }),
  annoyed: pose(["angry", "angry"], [0, 0], { scale: 1.05, squash: 0.97, y: 0.6 }),
  drowsy: pose(["heavy", "heavy"], [0, 1], { lid: 0.9, y: 1.2 }),
  sleeping: pose(["sleep", "sleep"], [0, 0.8], { rotate: 7, y: 2.2 }),
  waking: pose(["wide", "wide"], [0, -0.5]),
  talking: pose(["open", "open"], [0, 1], { scale: 1.02 }),
};

const BLINK_EVERY: Partial<Record<PoofMood, [number, number]>> = {
  idle: [2.4, 6],
  listening: [2, 4.5],
  thinking: [3, 6],
  working: [2.6, 5],
  writing: [2.4, 5],
  confused: [2.2, 4.5],
  annoyed: [3, 5],
  drowsy: [1.6, 3],
  talking: [2.6, 5],
};

/** How long a passing reaction holds before Poof drops back to what it was doing. */
const HOLD = { annoyed: 1.6, greet: 1.3, landed: 1.5, poke: 0.8, surprised: 0.55, waking: 1.2 };
const DROWSY_AFTER = 30;
const ASLEEP_AFTER = 42;
const LISTEN_FOR = 2.6;
const POINTER_STALE = 3;
const POKES_TO_ANNOY = 4;

type Spring = { c: number; k: number; v: number; x: number };
const spring = (x: number, k: number, c: number): Spring => ({ c, k, v: 0, x });
/** Fixed substeps: one 50ms step of a stiff spring diverges, and slow phones do deliver 50ms frames. */
const SUBSTEP = 1 / 120;
function stepSpring(s: Spring, target: number, dt: number) {
  const steps = Math.ceil(dt / SUBSTEP);
  const h = dt / steps;
  for (let i = 0; i < steps; i++) {
    s.v += (s.k * (target - s.x) - s.c * s.v) * h;
    s.x += s.v * h;
  }
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const easeOut = (t: number) => 1 - (1 - t) ** 3;

/** mulberry32: small, fast, and seedable, so a face can be replayed exactly. */
function random(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Particle = {
  life: number;
  max: number;
  rot: number;
  size: number;
  vr: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
};
const idleParticle = (): Particle => ({ life: 1, max: 0, rot: 0, size: 0, vr: 0, vx: 0, vy: 0, x: 0, y: 0 });

function frameOf(mood: PoofMood, rest: Pose, eyes: [EyeShape, EyeShape], lid: number): PoofFrame {
  return {
    body: {
      rotate: rest.rotate,
      scaleX: rest.scale * squashWidth(rest.squash),
      scaleY: rest.scale * rest.squash,
      x: rest.x,
      y: rest.y,
    },
    eyes: [withLid(eyes[0], lid), withLid(eyes[1], lid)],
    gaze: { ...rest.gaze },
    mood,
    particles: [
      ...Array.from({ length: SPARK_COUNT }, () => hidden("spark")),
      ...Array.from({ length: Z_COUNT }, () => hidden("z")),
    ],
  };
}

const hidden = (kind: PoofParticle["kind"]): PoofParticle => ({ kind, opacity: 0, rotate: 0, scale: 0, x: 24, y: 24 });

/** Squash keeps roughly the same volume: shorter is wider. */
function squashWidth(squash: number) {
  return 1 + (1 - squash) * 0.7;
}

/** The still face for a state: what a fresh face starts from, and all that reduced motion shows. */
export function restFrame(state: PoofState): PoofFrame {
  const rest = REST[state];
  return frameOf(state, rest, [EYES[rest.eyes[0]], EYES[rest.eyes[1]]], rest.lid);
}

export type PoofEngine = {
  /** Asked to greet but has not yet: a face torn down now should hand the greeting to the next one. */
  owesGreeting: () => boolean;
  /** The call's latest levels, read every frame while listening or talking and ignored otherwise. */
  hear: (levels: PoofLevels) => void;
  look: (point: PoofPoint | null) => void;
  /** `interrupted`: the visitor stopped the reply, so settling is a startle rather than a celebration. */
  setState: (state: PoofState, options?: { interrupted?: boolean }) => void;
  signal: (signal: PoofSignal) => void;
  step: (dt: number) => PoofFrame;
};

export function createPoofEngine({
  entrance = false,
  greet = false,
  seed = 1,
  state: initial,
}: {
  /** The face just popped in for a new reply: perk up before settling. */
  entrance?: boolean;
  /** Say hello shortly after mounting idle. Once per page: a remounted face should not greet again. */
  greet?: boolean;
  seed?: number;
  state: PoofState;
}): PoofEngine {
  const rand = random(seed);
  const range = (lo: number, hi: number) => lo + (hi - lo) * rand();
  const chance = (p: number) => rand() < p;

  let state = initial;
  let ambient: "idle" | "listening" | "drowsy" | "sleeping" = "idle";
  let transient: { mood: PoofMood; until: number } | null = null;
  let mood: PoofMood = initial;
  let t = 0;
  let enteredAt = 0;

  const rest = REST[initial];
  const body = {
    rotate: spring(rest.rotate, 90, 11),
    scale: spring(rest.scale, 160, 12),
    squash: spring(rest.squash, 260, 13),
    x: spring(rest.x, 90, 11),
    y: spring(rest.y, 120, 12),
  };
  const gaze = { x: spring(rest.gaze.x, 320, 30), y: spring(rest.gaze.y, 320, 30) };
  const lid = spring(rest.lid, 400, 40);

  let eyesFrom: [EyeShape, EyeShape] = [EYES[rest.eyes[0]], EYES[rest.eyes[1]]];
  let eyesTo = eyesFrom;
  let morph = 1;
  let eyesBackAt = Infinity;

  let pointer: PoofPoint | null = null;
  let pointerAt = -Infinity;
  let ignoringUntil = 0;
  let nextIgnore = range(6, 12);

  let blinkAt = -1;
  let secondBlinkAt = Infinity;
  let nextBlink = Infinity;
  let nextSwap = Infinity;
  let nextSaccade = 0;
  let saccade = { x: 0, y: 0 };
  let side = 1;
  let glanceUntil = 0;
  let nextGlance = Infinity;
  let lineX = -2.6;
  let nodAt = Infinity;
  let lastNod = -Infinity;
  let nextZ = Infinity;
  let idleFor = 0;
  let listenUntil = 0;
  let pokes: number[] = [];
  let greetAt = greet && initial === "idle" ? 0.35 : Infinity;
  if (entrance && initial === "thinking") transient = { mood: "surprised", until: HOLD.surprised };

  let heard: PoofLevels = { input: 0, output: 0 };
  const voice: PoofLevels = { input: 0, output: 0 };

  const sparks = Array.from({ length: SPARK_COUNT }, idleParticle);
  const zs = Array.from({ length: Z_COUNT }, idleParticle);

  const currentEyes = (): [EyeShape, EyeShape] => {
    const p = easeOut(clamp(morph, 0, 1));
    return [mixEye(eyesFrom[0], eyesTo[0], p), mixEye(eyesFrom[1], eyesTo[1], p)];
  };
  const showEyes = (names: [EyeName, EyeName], holdFor = Infinity) => {
    eyesFrom = currentEyes();
    eyesTo = [EYES[names[0]], EYES[names[1]]];
    morph = 0;
    eyesBackAt = t + holdFor;
  };

  const scheduleBlink = () => {
    const every = BLINK_EVERY[mood];
    nextBlink = every ? t + range(...every) : Infinity;
  };
  const blink = () => {
    blinkAt = t;
    secondBlinkAt = chance(0.18) ? t + 0.24 : Infinity;
    scheduleBlink();
  };

  const burst = (count: number, spread = 1) => {
    let made = 0;
    for (const spark of sparks) {
      if (made >= count) break;
      if (spark.life < spark.max) continue;
      const angle = -Math.PI / 2 + range(-1.3, 1.3) * spread;
      const speed = range(16, 30);
      Object.assign(spark, {
        life: 0,
        max: range(0.55, 0.9),
        rot: range(0, 90),
        size: range(1.7, 2.7),
        vr: range(-200, 200),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        x: 24 + body.x.x + Math.cos(angle) * 9,
        y: 22 + body.y.x + Math.sin(angle) * 9,
      });
      made++;
    }
  };

  const react = (next: PoofMood, hold: number) => {
    transient = { mood: next, until: t + hold };
  };

  /** Starts a mood's clocks: blinks, expression changes, glances. */
  const arm = () => {
    enteredAt = t;
    scheduleBlink();
    nextSwap = t + range(2, 4);
    nextSaccade = t;
    nextGlance = t + range(4, 7);
    nodAt = t + range(3.5, 5.5);
    nextZ = t + 0.8;
    lineX = -2.6;
  };

  const enter = (next: PoofMood) => {
    mood = next;
    arm();
    showEyes(REST[next].eyes);
    switch (next) {
      case "happy":
        body.y.v -= 38;
        body.squash.v += 2.4;
        burst(pokes.length ? 4 : 7);
        break;
      case "surprised":
        body.scale.v += 2.2;
        body.y.v -= 20;
        break;
      case "waking":
        body.y.v -= 40;
        body.squash.v += 3;
        showEyes(["sleep", "sleep"]);
        burst(5, 1.4);
        break;
      case "annoyed":
        body.squash.v -= 2;
        break;
    }
  };

  const activity = () => {
    idleFor = 0;
    if (ambient === "sleeping") {
      ambient = "idle";
      react("waking", HOLD.waking);
    } else if (ambient === "drowsy") {
      ambient = "idle";
      react("surprised", HOLD.surprised);
    }
  };

  const pointerGaze = () => {
    if (!pointer || t - pointerAt > POINTER_STALE || t < ignoringUntil) return null;
    const distance = Math.hypot(pointer.x, pointer.y);
    const reach = Math.min(1, distance / 36) / Math.max(distance, 1);
    return { x: pointer.x * reach * 3.4, y: pointer.y * reach * 3 };
  };

  const wander = (every: [number, number], spanX: number, spanY: number, centreY = 0) => {
    if (t >= nextSaccade) {
      const next = chance(0.35) ? { x: 0, y: centreY } : { x: range(-spanX, spanX), y: centreY + range(-spanY, spanY) };
      if (Math.hypot(next.x - saccade.x, next.y - saccade.y) > 2.5 && chance(0.25)) blink();
      saccade = next;
      nextSaccade = t + range(...every);
    }
    return saccade;
  };

  arm();

  const step = (dt: number): PoofFrame => {
    t += dt;

    if (t >= greetAt) {
      greetAt = Infinity;
      if (state === "idle" && !transient) react("happy", HOLD.greet);
    }
    if (transient && t >= transient.until) transient = null;
    if (state === "idle" && !transient) {
      if (ambient === "listening" && t >= listenUntil) ambient = "idle";
      if (ambient !== "listening") idleFor += dt;
      if (ambient === "idle" && idleFor > DROWSY_AFTER) ambient = "drowsy";
      if (ambient === "drowsy" && idleFor > ASLEEP_AFTER) ambient = "sleeping";
    }
    const next = transient?.mood ?? (state === "idle" ? ambient : state);
    if (next !== mood) enter(next);

    // Raw levels flicker frame to frame; a short follow keeps the body from buzzing.
    const follow = Math.min(1, dt * 14);
    voice.input += (heard.input - voice.input) * follow;
    voice.output += (heard.output - voice.output) * follow;

    const since = t - enteredAt;
    const r = REST[mood];
    let x = r.x;
    let y = r.y;
    let rotate = r.rotate;
    let scale = r.scale;
    let squash = r.squash;
    let lidTarget = r.lid;
    let look: { x: number; y: number } = r.gaze;

    if (t >= nextIgnore) {
      ignoringUntil = t + range(0.8, 1.6);
      nextIgnore = t + range(6, 12);
    }
    const lean = (p: { x: number; y: number } | null) => {
      if (!p || !pointer) return;
      x += clamp(pointer.x / 90, -1, 1);
      rotate += clamp(pointer.x / 120, -1, 1) * 2.5;
    };

    switch (mood) {
      case "idle": {
        rotate += 1.6 * Math.sin(0.5 * t) + 0.7 * Math.sin(0.17 * t);
        y += 0.5 * Math.sin(0.9 * t);
        scale += 0.012 * Math.sin(1.3 * t);
        const followed = pointerGaze();
        lean(followed);
        look = followed ?? wander([1.2, 3.5], 2.4, 1.8);
        if (t >= nextSwap) {
          if (chance(0.3)) showEyes(["happy", "happy"], range(1, 1.6));
          nextSwap = t + range(7, 13);
        }
        break;
      }
      case "listening": {
        rotate += 0.8 * Math.sin(0.8 * t);
        if (state === "listening") scale += 0.035 * voice.input;
        const reading = wander([0.35, 0.8], 1.2, 0.3, r.gaze.y);
        look = { x: r.gaze.x + reading.x, y: reading.y };
        if (t >= nextSwap) {
          showEyes(chance(0.5) ? ["open", "open"] : ["wide", "wide"]);
          nextSwap = t + range(2, 4);
        }
        break;
      }
      case "talking": {
        rotate += 1.2 * Math.sin(0.7 * t);
        // Taller and a little bigger as it speaks up, like a chest filling with the words.
        scale += 0.09 * voice.output;
        squash += 0.05 * voice.output;
        look = wander([0.9, 2.2], 1.8, 0.8, r.gaze.y);
        if (t >= nextSwap) {
          if (chance(0.35)) showEyes(["happy", "happy"], range(0.6, 1.1));
          nextSwap = t + range(2.5, 4.5);
        }
        break;
      }
      case "thinking": {
        rotate += 3 * Math.sin(0.35 * t);
        y += 0.4 * Math.sin(0.6 * t);
        look = { x: 2.4 * Math.sin(0.45 * t) + 0.6 * Math.sin(1.3 * t), y: r.gaze.y + 0.3 * Math.sin(0.7 * t) };
        if (t >= nextSwap) {
          const pool: [EyeName, EyeName][] = [
            ["half", "half"],
            ["open", "open"],
            ["doubt", "half"],
          ];
          showEyes(pool[Math.floor(range(0, pool.length))]);
          nextSwap = t + range(1.8, 3.4);
        }
        break;
      }
      case "working": {
        const pump = Math.max(0, Math.sin(Math.PI * 3.2 * t));
        rotate += 2 + 1.2 * Math.sin(1.7 * t);
        y += 0.6 * pump;
        squash -= 0.035 * pump;
        look = wander([0.22, 0.55], 3, 0.9, 0.5);
        if (t >= nextSwap) {
          showEyes(chance(0.75) ? ["focus", "focus"] : ["open", "open"]);
          nextSwap = t + range(1.8, 3.2);
        }
        break;
      }
      case "writing": {
        const nod = Math.max(0, Math.sin(2 * Math.PI * 1.4 * t));
        y += 0.9 * nod;
        squash -= 0.02 * nod;
        rotate += 1.2 * Math.sin(0.6 * t);
        if (t >= nextSaccade) {
          lineX = lineX >= 2.6 ? -2.6 : lineX + 0.9;
          nextSaccade = t + (lineX === -2.6 ? 0.45 : range(0.28, 0.4));
        }
        look = { x: lineX, y: r.gaze.y };
        if (t >= nextGlance) {
          glanceUntil = t + 0.8;
          nextGlance = t + range(4, 7);
        }
        if (t < glanceUntil) look = pointerGaze() ?? { x: 0, y: -1.2 };
        break;
      }
      case "confused": {
        if (t >= nextSwap) {
          side = -side;
          showEyes(side > 0 ? ["doubt", "open"] : ["open", "doubt"]);
          nextSwap = t + range(2, 4);
        }
        rotate = r.rotate * side + 0.8 * Math.sin(0.9 * t);
        const drift = wander([0.8, 1.8], 0.8, 0.5);
        look = { x: r.gaze.x * side + drift.x, y: r.gaze.y + drift.y };
        break;
      }
      case "happy": {
        rotate += 4 * Math.sin(9 * since) * Math.max(0, 1 - since / 0.9);
        const followed = pointerGaze();
        lean(followed);
        look = followed ?? r.gaze;
        break;
      }
      case "surprised":
        break;
      case "annoyed": {
        rotate += 4.5 * Math.sin(30 * since) * Math.max(0, 1 - since / 0.6);
        look = pointerGaze() ?? r.gaze;
        break;
      }
      case "drowsy": {
        rotate += 3 * Math.sin(0.3 * t);
        scale += 0.02 * Math.sin(0.4 * t);
        lidTarget += 0.08 * Math.sin(0.8 * t);
        const dozing = t - nodAt;
        if (dozing > 0 && dozing < 1.4) {
          const p = (dozing / 1.4) ** 2;
          lidTarget *= 1 - p;
          y += 2.5 * p;
          rotate += 4 * p;
        } else if (dozing >= 1.4 && dozing < 1.75) {
          if (dozing - dt < 1.4) body.y.v -= 30;
          lidTarget = 1;
        } else if (dozing >= 1.75) {
          nodAt = t + range(3.5, 5.5);
        }
        break;
      }
      case "sleeping": {
        const breath = Math.sin(0.9 * t);
        y += 0.3 * breath;
        rotate += 1.2 * Math.sin(0.35 * t);
        scale += 0.028 * breath;
        squash += 0.015 * breath;
        if (t >= nextZ) {
          const z = zs.find((p) => p.life >= p.max);
          if (z)
            Object.assign(z, { life: 0, max: 2.4, rot: range(-15, 5), size: 1.4, vr: 0, vx: 3, vy: -5, x: 35, y: 13 });
          nextZ = t + range(1.8, 2.6);
        }
        break;
      }
      case "waking": {
        rotate += 6 * Math.sin(16 * since) * Math.max(0, 1 - since);
        if (since > 0.15 && eyesTo[0] === EYES.sleep) showEyes(["wide", "wide"]);
        if (since > 0.6 && eyesTo[0] === EYES.wide) showEyes(["open", "open"]);
        break;
      }
    }

    if (t >= eyesBackAt) showEyes(REST[mood].eyes);
    if (t >= nextBlink) blink();
    if (t >= secondBlinkAt) {
      blinkAt = t;
      secondBlinkAt = Infinity;
    }

    stepSpring(body.x, x, dt);
    stepSpring(body.y, y, dt);
    stepSpring(body.rotate, rotate, dt);
    stepSpring(body.scale, scale, dt);
    stepSpring(body.squash, squash, dt);
    stepSpring(gaze.x, look.x, dt);
    stepSpring(gaze.y, look.y, dt);
    stepSpring(lid, lidTarget, dt);
    morph += dt / 0.18;

    const blinkT = (t - blinkAt) / (mood === "drowsy" ? 0.34 : 0.17);
    const blinkLid = blinkAt < 0 || blinkT >= 1 ? 1 : blinkT < 0.4 ? 1 - blinkT / 0.4 : easeOut((blinkT - 0.4) / 0.6);
    const eyes = currentEyes();
    const openness = clamp(lid.x, 0, 1.1) * blinkLid;

    for (const spark of sparks) {
      if (spark.life >= spark.max) continue;
      spark.life += dt;
      spark.vy += 26 * dt;
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      spark.rot += spark.vr * dt;
    }
    for (const z of zs) {
      if (z.life >= z.max) continue;
      z.life += dt;
      z.x += (z.vx + 2 * Math.sin(z.life * 3)) * dt;
      z.y += z.vy * dt;
      z.size = 1.4 + 0.5 * z.life;
    }

    const squashed = clamp(body.squash.x, 0.8, 1.2);
    const scaled = clamp(body.scale.x, 0.85, 1.2);
    return {
      body: {
        rotate: body.rotate.x,
        scaleX: scaled * squashWidth(squashed),
        scaleY: scaled * squashed,
        x: body.x.x,
        y: body.y.x,
      },
      eyes: [withLid(eyes[0], openness), withLid(eyes[1], openness)],
      gaze: { x: clamp(gaze.x.x + body.x.x * 0.6, -4.5, 4.5), y: clamp(gaze.y.x, -4.5, 4.5) },
      mood,
      particles: [
        ...sparks.map((p): PoofParticle => {
          const k = p.max ? clamp(p.life / p.max, 0, 1) : 1;
          return {
            kind: "spark",
            opacity: k >= 1 ? 0 : 1 - k ** 3,
            rotate: p.rot,
            scale: p.size * Math.sin(Math.PI * k),
            x: p.x,
            y: p.y,
          };
        }),
        ...zs.map((p): PoofParticle => {
          const k = p.max ? clamp(p.life / p.max, 0, 1) : 1;
          return {
            kind: "z",
            opacity: k >= 1 ? 0 : Math.min(1, k / 0.15, (1 - k) / 0.35),
            rotate: p.rot,
            scale: p.size,
            x: p.x,
            y: p.y,
          };
        }),
      ],
    };
  };

  return {
    owesGreeting: () => greetAt !== Infinity,
    hear({ input, output }) {
      const level = (n: number) => (Number.isFinite(n) ? clamp(n, 0, 1) : 0);
      heard = { input: level(input), output: level(output) };
    },
    look(point) {
      pointer = point;
      if (!point) return;
      pointerAt = t;
      activity();
    },
    setState(next, { interrupted = false } = {}) {
      if (next === state) return;
      const previous = state;
      state = next;
      transient = null;
      greetAt = Infinity;
      if (next === "idle") {
        ambient = "idle";
        idleFor = 0;
        if (previous === "writing" || previous === "working" || previous === "thinking") {
          react(interrupted ? "surprised" : "happy", interrupted ? HOLD.surprised : HOLD.landed);
        }
      } else if (next === "thinking" && previous === "idle") {
        react("surprised", HOLD.surprised);
      }
    },
    signal(signal) {
      const wasAsleep = ambient === "sleeping";
      activity();
      if (signal === "typing") {
        if (state !== "idle") return;
        ambient = "listening";
        listenUntil = t + LISTEN_FOR;
        if (mood === "listening" && t - lastNod > 0.12) {
          body.y.v += 9;
          lastNod = t;
        }
      } else if (signal === "poke" && !wasAsleep) {
        pokes = [...pokes.filter((at) => t - at < 2.5), t];
        if (pokes.length >= POKES_TO_ANNOY) {
          pokes = [];
          react("annoyed", HOLD.annoyed);
        } else {
          react("happy", HOLD.poke);
          body.squash.v -= 3.5;
          if (mood === "happy") burst(4);
        }
      }
    },
    step,
  };
}
