import type { TargetAndTransition, Transition } from "motion/react";

import { cn } from "#/lib/utils";
import { motion, useReducedMotion } from "motion/react";

/**
 * What Poof is doing right now. Only states that actually occur are modelled: a
 * settled or failed turn drops the mark entirely rather than resting in place.
 */
export type PoofMarkState = "thinking" | "working" | "writing";

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * One expression per state. Everything is carried by the face itself: how the body
 * deforms (tilt, squash, bob), where the eyes look, and how open they are. The three
 * are kept apart on three axes at once so they never blur together: thinking is slow
 * and upward, working is fast and horizontal with narrowed eyes, writing is rhythmic
 * and downward with open eyes.
 *
 * `moving` is the looping pose; `rest` is the single frame it collapses to under
 * prefers-reduced-motion, chosen so the state is still legible without motion.
 */
type Expression = {
  eyes: { moving: TargetAndTransition; rest: TargetAndTransition; timing: Transition };
  figure: { moving: TargetAndTransition; rest: TargetAndTransition; timing: Transition };
  gaze: { moving: TargetAndTransition; rest: TargetAndTransition; timing: Transition };
};

// Eye openness doubles as the blink track: hold the state's openness, snap shut, reopen.
const blink = (open: number): TargetAndTransition => ({ scaleY: [open, open, 0.1, open] });
const BLINK_TIMING: Transition = { duration: 4.2, ease: "easeInOut", times: [0, 0.9, 0.95, 1] };

const EXPRESSIONS: Record<PoofMarkState, Expression> = {
  // Head cocked, eyes a little narrowed and looking up, drifting side to side as if
  // recalling something. Everything here is slow.
  thinking: {
    eyes: { moving: blink(0.85), rest: { scaleY: 0.85 }, timing: BLINK_TIMING },
    figure: {
      moving: { rotate: 8, scale: [1, 1.03, 1] },
      rest: { rotate: 8, scale: 1 },
      timing: { duration: 3.2, ease: "easeInOut" },
    },
    gaze: {
      moving: { x: [-2.5, 3, -2.5], y: -3.5 },
      rest: { x: 1.5, y: -3.5 },
      timing: { duration: 3.4, ease: "easeInOut" },
    },
  },
  // Squats and pumps as if straining, eyes narrowed to slits and darting left and
  // right: scanning. Everything here is fast.
  working: {
    eyes: { moving: blink(0.45), rest: { scaleY: 0.45 }, timing: BLINK_TIMING },
    figure: {
      moving: { scaleX: 1.05, scaleY: [0.93, 0.98, 0.93], y: 1 },
      rest: { scaleX: 1.05, scaleY: 0.94, y: 1 },
      timing: { duration: 0.42, ease: "easeInOut" },
    },
    gaze: {
      moving: { x: [-3, 3, -3], y: 0.5 },
      rest: { x: 0, y: 0.5 },
      timing: { duration: 0.85, ease: "easeInOut" },
    },
  },
  // Nods on a typing cadence, eyes open and on the line it is writing, with a glance
  // up at the reader every few seconds before going back to the page.
  writing: {
    eyes: { moving: blink(1), rest: { scaleY: 1 }, timing: BLINK_TIMING },
    figure: {
      moving: { scaleY: [1, 0.97, 1], y: [0, 1.3, 0] },
      rest: { scaleY: 1, y: 0 },
      timing: { duration: 0.7, ease: "easeInOut" },
    },
    gaze: {
      moving: { x: [-1, 1, 0, 0, -1], y: [2.2, 2.2, -1.2, -1.2, 2.2] },
      rest: { x: 0, y: 2.2 },
      timing: { duration: 5, ease: "easeInOut", times: [0, 0.78, 0.84, 0.93, 1] },
    },
  },
};

/**
 * Poof's face. A soft squircle with two pill eyes, and nothing else: the state lives
 * entirely in the expression, the way the Grok Bot avatars carry status through
 * motion rather than badges. Body and eyes deform as one figure so it moves like a
 * creature, with gaze and blink layered on top.
 *
 * Every animation is transform-only, so a streaming reply never pays for a layout
 * pass. Decorative on purpose: the status text beside it already carries the state
 * for assistive tech.
 */
export function PoofMark({ className, state }: { className?: string; state: PoofMarkState }) {
  const still = useReducedMotion() ?? false;
  const expression = EXPRESSIONS[state];

  const pose = (track: { moving: TargetAndTransition; rest: TargetAndTransition }) =>
    still ? track.rest : track.moving;
  // Loops repeat forever; a change of state tweens into the new loop's first frame.
  const loop = (timing: Transition): Transition => (still ? { duration: 0 } : { repeat: Infinity, ...timing });

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      className={cn("size-14 shrink-0 overflow-visible", className)}
      data-slot="poof-mark"
      data-state={state}
      aria-hidden="true"
      initial={still ? false : { opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.24, ease: EASE_OUT }}
    >
      <motion.g animate={pose(expression.figure)} transition={loop(expression.figure.timing)}>
        <rect className="fill-primary" data-slot="poof-mark-body" x="7" y="9" width="34" height="30" rx="13" />
        <motion.g animate={pose(expression.gaze)} transition={loop(expression.gaze.timing)}>
          {[16.5, 27.5].map((x) => (
            <motion.rect
              key={x}
              className="fill-primary-foreground"
              data-slot="poof-mark-eye"
              x={x}
              y="19"
              width="4"
              height="10"
              rx="2"
              animate={pose(expression.eyes)}
              transition={loop(expression.eyes.timing)}
            />
          ))}
        </motion.g>
      </motion.g>
    </motion.svg>
  );
}
