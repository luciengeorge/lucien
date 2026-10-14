import type { Transition } from "motion/react";

import { cn } from "#/lib/utils";
import { motion, useReducedMotion, useReducedMotionConfig } from "motion/react";
import { useEffect, useEffectEvent, useRef, useState } from "react";

import type { PoofEngine, PoofFrame, PoofState } from "./poof-engine";

import { createPoofEngine, restFrame } from "./poof-engine";
import { eyePath } from "./poof-eyes";
import { usePoofSignals } from "./poof-signals";

export type PoofMarkState = PoofState;

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];
const EYE_Y = 24;
/** Bottom centre of the body: the point Poof sways and squashes around, like feet on the ground. */
const FOOT = 39;
const SPARK = "M0 -1Q.18 -.18 1 0Q.18 .18 0 1Q-.18 .18 -1 0Q-.18 -.18 0 -1Z";
const ZED = "M-.8 -.8H.8L-.8 .8H.8";

/** The first face on a page says hello. The transcript remounts when a conversation is created, and a second hello there reads as a glitch. */
let greeted = false;

const round = (n: number) => Math.round(n * 100) / 100;
const eyeX = (index: number) => (index === 0 ? 18.5 : 29.5);
const eyeD = (frame: PoofFrame, index: number) =>
  eyePath(frame.eyes[index === 0 ? 0 : 1], eyeX(index), EYE_Y, index === 0 ? "left" : "right");
const figureTransform = ({ body }: PoofFrame) =>
  `translate(${round(24 + body.x)} ${round(FOOT + body.y)}) rotate(${round(body.rotate)}) scale(${round(body.scaleX)} ${round(body.scaleY)}) translate(-24 -${FOOT})`;
const gazeTransform = ({ gaze }: PoofFrame) => `translate(${round(gaze.x)} ${round(gaze.y)})`;
const particleTransform = (particle: PoofFrame["particles"][number]) =>
  `translate(${round(particle.x)} ${round(particle.y)}) rotate(${round(particle.rotate)}) scale(${round(Math.max(particle.scale, 0.01))})`;

/** Writes a frame straight to the SVG: a face that moves every frame must not re-render React every frame. */
function painter(svg: SVGSVGElement) {
  const all = (slot: string) => [...svg.querySelectorAll(`[data-slot="${slot}"]`)];
  const [figure] = all("poof-mark-figure");
  const [gaze] = all("poof-mark-gaze");
  const eyes = all("poof-mark-eye");
  const particles = all("poof-mark-particle");
  let mood = svg.getAttribute("data-mood");
  const opacities = particles.map(() => "0");
  return (frame: PoofFrame) => {
    figure?.setAttribute("transform", figureTransform(frame));
    gaze?.setAttribute("transform", gazeTransform(frame));
    eyes.forEach((eye, index) => eye.setAttribute("d", eyeD(frame, index)));
    frame.particles.forEach((particle, index) => {
      const element = particles[index];
      if (!element) return;
      const opacity = String(round(particle.opacity));
      if (opacity !== opacities[index]) {
        element.setAttribute("opacity", opacity);
        opacities[index] = opacity;
      }
      if (particle.opacity > 0) element.setAttribute("transform", particleTransform(particle));
    });
    if (frame.mood !== mood) {
      mood = frame.mood;
      svg.setAttribute("data-mood", mood);
    }
  };
}

/**
 * Poof's face: a soft squircle with two eyes, and the state lives entirely in how it moves, the
 * way the Grok Bot avatars carry status through character rather than badges.
 *
 * A small procedural engine (`poof-engine.ts`) drives it: springs for the body, gaze and lids,
 * slow overlapping sine waves so idle motion never visibly loops, and random timers for blinks,
 * glances and expression changes. On top of the app's state it adds its own life: it follows the
 * cursor, listens while you type, is pleased when an answer lands, dozes off when left alone and
 * reacts to being poked. Under prefers-reduced-motion it shows each state's still face instead.
 *
 * Every frame is a handful of attribute writes on one small SVG, and the loop pauses while the
 * face is off screen or the tab is hidden. The exit is the one motion-library animation: the face
 * pops and its box closes up so the header settles onto the label. Mount it inside an
 * `AnimatePresence` for that to play.
 *
 * Decorative on purpose: the status text beside it already carries the state for assistive tech.
 */
export function PoofMark({
  className,
  entrance = true,
  state,
}: {
  className?: string;
  /**
   * Play the mount pop and perk up. Off for the timeline mark, which always replaces the
   * pending-reply mark in the same spot: a second instance popping in is a visible blink.
   */
  entrance?: boolean;
  state: PoofMarkState;
}) {
  // The OS preference, or a `MotionConfig reducedMotion="always"` above: motion's config hook alone
  // ignores the OS unless the app opts in with `reducedMotion="user"`.
  const prefersStill = useReducedMotion() ?? false;
  const forcedStill = useReducedMotionConfig() ?? false;
  const still = prefersStill || forcedStill;
  const signals = usePoofSignals();
  const svgRef = useRef<SVGSVGElement>(null);
  const live = useRef<{ engine: PoofEngine; paint: (frame: PoofFrame) => void } | null>(null);
  // While animating, React only ever renders the mount frame: later frames are painted directly,
  // and rendering a new frame on a state change would fight the engine for one frame.
  const [mountFrame] = useState(() => restFrame(state));
  const frame = still ? restFrame(state) : mountFrame;

  const createEngine = useEffectEvent(() => {
    const greet = !greeted && state === "idle";
    if (greet) greeted = true;
    return createPoofEngine({ entrance, greet, seed: Math.floor(Math.random() * 2 ** 32), state });
  });

  useEffect(() => {
    const svg = svgRef.current;
    if (still || !svg) return;
    const engine = createEngine();
    const paint = painter(svg);
    live.current = { engine, paint };

    let raf = 0;
    let last = 0;
    let running = false;
    let onScreen = true;
    let pointer: { x: number; y: number } | null = null;
    let pointerMoved = false;

    let dozing = false;
    const tick = (now: number) => {
      // A dozing face barely moves, so it only needs ~20fps: dt keeps accumulating between paints.
      if (dozing && last && now - last < 50) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      if (pointerMoved) {
        // Measured here, before this frame's writes, so the read never forces a second layout.
        pointerMoved = false;
        const rect = svg.getBoundingClientRect();
        const unit = rect.width / 48 || 1;
        engine.look(pointer && { x: (pointer.x - rect.left) / unit - 24, y: (pointer.y - rect.top) / unit - 24 });
      }
      const frame = engine.step(dt);
      dozing = frame.mood === "sleeping" || frame.mood === "drowsy";
      paint(frame);
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (running || !onScreen || document.hidden || typeof requestAnimationFrame !== "function") return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? true;
      if (onScreen) start();
      else stop();
    });
    observer.observe(svg);
    const onVisibility = () => (document.hidden ? stop() : start());
    const onPointerMove = (event: PointerEvent) => {
      pointer = { x: event.clientX, y: event.clientY };
      pointerMoved = true;
    };
    const onPointerLeave = () => {
      pointer = null;
      pointerMoved = true;
    };
    const onActivity = () => engine.signal("activity");
    const unsubscribe = signals?.subscribe((signal) => {
      engine.signal(signal);
      paint(engine.step(0));
    });

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("wheel", onActivity, { passive: true });
    window.addEventListener("touchstart", onActivity, { passive: true });
    start();

    return () => {
      stop();
      observer.disconnect();
      unsubscribe?.();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("wheel", onActivity);
      window.removeEventListener("touchstart", onActivity);
      live.current = null;
      if (engine.owesGreeting()) greeted = false;
    };
  }, [signals, still]);

  useEffect(() => {
    live.current?.engine.setState(state);
  }, [state]);

  const poke = () => {
    if (!live.current) return;
    live.current.engine.signal("poke");
    live.current.paint(live.current.engine.step(0));
  };

  // The box collapses over the tail of the pop, once the face is already shrinking, so the
  // label glides into place rather than snapping the moment the face is gone. The box owns
  // its own trailing space (mr-3) and collapses that too, so the header wrappers need no gap
  // and there is no spacing constant elsewhere for this exit to fall out of step with.
  const exitTiming: Transition = still ? { duration: 0 } : { duration: 0.3, delay: 0.14, ease: EASE_OUT };

  return (
    <motion.div
      className={cn("mr-3 size-14 shrink-0", className)}
      data-slot="poof-mark-box"
      exit={{ height: 0, marginRight: 0, width: 0 }}
      transition={exitTiming}
    >
      <motion.svg
        ref={svgRef}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        className="size-full overflow-visible"
        data-slot="poof-mark"
        data-state={state}
        data-mood={frame.mood}
        aria-hidden="true"
        onPointerDown={poke}
        initial={still || !entrance ? false : { opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={still ? { opacity: 0 } : { opacity: [1, 1, 0], scale: [1, 1.12, 0] }}
        transition={still ? { duration: 0 } : { duration: 0.44, ease: EASE_OUT, times: [0, 0.32, 1] }}
      >
        <g key={still ? "still" : "live"} data-slot="poof-mark-figure" transform={figureTransform(frame)}>
          <rect className="fill-primary" data-slot="poof-mark-body" x="7" y="9" width="34" height="30" rx="13" />
          <g data-slot="poof-mark-gaze" transform={gazeTransform(frame)}>
            {[0, 1].map((index) => (
              <path key={index} className="fill-primary-foreground" data-slot="poof-mark-eye" d={eyeD(frame, index)} />
            ))}
          </g>
        </g>
        <g key={still ? "still" : "live"} className="pointer-events-none">
          {frame.particles.map((particle, index) =>
            particle.kind === "spark" ? (
              <path key={index} className="fill-primary" data-slot="poof-mark-particle" d={SPARK} opacity="0" />
            ) : (
              <path
                key={index}
                className="fill-none stroke-neutral-400"
                data-slot="poof-mark-particle"
                d={ZED}
                opacity="0"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={0.5}
              />
            ),
          )}
        </g>
      </motion.svg>
    </motion.div>
  );
}
