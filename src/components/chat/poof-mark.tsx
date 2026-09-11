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
 * One expression per state, split into two layers that never share a transition.
 *
 * `pose` is what the state *holds*: head tilt, squat, where the eyes sit, how open they
 * are. Plain scalars on a non-repeating transition, so a change of state eases from
 * wherever the face is into the new pose instead of cutting. `oscillation` is what the
 * state *does* on top of that: relative keyframe loops that start and end on identity, so
 * each repeat wraps seamlessly and entering a state never cuts. Anything a state *holds*,
 * including the mean of a sweep, lives in `pose`, never in the loop. Under
 * prefers-reduced-motion the oscillation is dropped and the pose is applied instantly,
 * which keeps the three states legible without motion.
 *
 * The three are kept apart on three axes at once so they never blur together: thinking is
 * slow and upward, working is fast and horizontal with narrowed eyes, writing is rhythmic
 * and downward with open eyes.
 */
type Layer = { moving: TargetAndTransition; rest: TargetAndTransition; timing: Transition };
type Expression = {
  pose: { eyes: TargetAndTransition; figure: TargetAndTransition; gaze: TargetAndTransition };
  oscillation: { eyes: Layer; figure: Layer; gaze: Layer };
};

// Blink is relative to the pose's openness: hold, snap shut, reopen.
const BLINK: Layer = {
  moving: { scaleY: [1, 1, 0.1, 1] },
  rest: { scaleY: 1 },
  timing: { duration: 4.2, ease: "easeInOut", times: [0, 0.9, 0.95, 1] },
};

export const EXPRESSIONS: Record<PoofMarkState, Expression> = {
  // Head cocked, eyes a little narrowed and looking up, drifting side to side as if
  // recalling something. Everything here is slow.
  thinking: {
    pose: { eyes: { scaleY: 0.85 }, figure: { rotate: 8, scaleX: 1, scaleY: 1, y: 0 }, gaze: { x: 0.25, y: -3.5 } },
    oscillation: {
      eyes: BLINK,
      figure: { moving: { scale: [1, 1.03, 1] }, rest: { scale: 1 }, timing: { duration: 3.2, ease: "easeInOut" } },
      gaze: { moving: { x: [0, 2.75, -2.75, 0] }, rest: { x: 0 }, timing: { duration: 3.4, ease: "easeInOut" } },
    },
  },
  // Squats and pumps as if straining, eyes narrowed to slits and darting left and
  // right: scanning. Everything here is fast.
  working: {
    pose: { eyes: { scaleY: 0.45 }, figure: { rotate: 0, scaleX: 1.05, scaleY: 0.955, y: 1 }, gaze: { x: 0, y: 0.5 } },
    oscillation: {
      eyes: BLINK,
      figure: {
        moving: { scaleY: [1, 1.026, 0.975, 1] },
        rest: { scaleY: 1 },
        timing: { duration: 0.42, ease: "easeInOut" },
      },
      gaze: { moving: { x: [0, 3, -3, 0] }, rest: { x: 0 }, timing: { duration: 0.85, ease: "easeInOut" } },
    },
  },
  // Nods on a typing cadence, eyes open and on the line it is writing, with a glance
  // up at the reader every few seconds before going back to the page.
  writing: {
    pose: { eyes: { scaleY: 1 }, figure: { rotate: 0, scaleX: 1, scaleY: 1, y: 0 }, gaze: { x: 0, y: 2.2 } },
    oscillation: {
      eyes: BLINK,
      figure: {
        moving: { scaleY: [1, 0.97, 1], y: [0, 1.3, 0] },
        rest: { scaleY: 1, y: 0 },
        timing: { duration: 0.7, ease: "easeInOut" },
      },
      gaze: {
        moving: { x: [0, 1, -1, 0, 0], y: [0, 0, -3.4, -3.4, 0] },
        rest: { x: 0, y: 0 },
        timing: { duration: 5, ease: "easeInOut", times: [0, 0.78, 0.84, 0.93, 1] },
      },
    },
  },
};

/**
 * Poof's face. A soft squircle with two pill eyes, and nothing else: the state lives
 * entirely in the expression, the way the Grok Bot avatars carry status through
 * motion rather than badges. Body and eyes deform as one figure so it moves like a
 * creature, with gaze and blink layered on top.
 *
 * Every animation while a reply streams is transform-only, so it never pays for a
 * layout pass. The one exception is the exit: when the turn settles the face grows a
 * touch, shrinks to nothing, and its box closes up so the header settles onto the
 * label instead of jumping. That runs once per turn, after streaming is over. Mount it
 * inside an `AnimatePresence` for the exit to play.
 *
 * Decorative on purpose: the status text beside it already carries the state for
 * assistive tech.
 */
export function PoofMark({
  className,
  entrance = true,
  state,
}: {
  className?: string;
  /**
   * Play the mount fade. Off for the timeline mark, which always replaces the pending-reply
   * mark in the same spot: a second instance fading in from nothing is a visible blink.
   */
  entrance?: boolean;
  state: PoofMarkState;
}) {
  const still = useReducedMotion() ?? false;
  const { oscillation, pose } = EXPRESSIONS[state];

  // A state change eases into its new pose; under reduced motion it just lands there. A fresh
  // mount lands in pose too (`initial` below): the pending-reply mark and the timeline mark are
  // different instances, and without this the face straightened and re-tilted for a beat when
  // the first assistant part arrived. The root's fade and scale already carry the entrance.
  const settle: Transition = still ? { duration: 0 } : { duration: 0.35, ease: EASE_OUT };
  const move = (layer: Layer) => (still ? layer.rest : layer.moving);
  const loop = (layer: Layer): Transition => (still ? { duration: 0 } : { repeat: Infinity, ...layer.timing });

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
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        className="size-full overflow-visible"
        data-slot="poof-mark"
        data-state={state}
        aria-hidden="true"
        initial={still || !entrance ? false : { opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={still ? { opacity: 0 } : { opacity: [1, 1, 0], scale: [1, 1.12, 0] }}
        transition={still ? { duration: 0 } : { duration: 0.44, ease: EASE_OUT, times: [0, 0.32, 1] }}
      >
        <motion.g initial={pose.figure} animate={pose.figure} transition={settle}>
          <motion.g animate={move(oscillation.figure)} transition={loop(oscillation.figure)}>
            <rect className="fill-primary" data-slot="poof-mark-body" x="7" y="9" width="34" height="30" rx="13" />
            <motion.g initial={pose.gaze} animate={pose.gaze} transition={settle}>
              <motion.g animate={move(oscillation.gaze)} transition={loop(oscillation.gaze)}>
                {[16.5, 27.5].map((x) => (
                  <motion.g key={x} initial={pose.eyes} animate={pose.eyes} transition={settle}>
                    <motion.rect
                      className="fill-primary-foreground"
                      data-slot="poof-mark-eye"
                      x={x}
                      y="19"
                      width="4"
                      height="10"
                      rx="2"
                      animate={move(oscillation.eyes)}
                      transition={loop(oscillation.eyes)}
                    />
                  </motion.g>
                ))}
              </motion.g>
            </motion.g>
          </motion.g>
        </motion.g>
      </motion.svg>
    </motion.div>
  );
}
