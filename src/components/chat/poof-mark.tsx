import type { TargetAndTransition, Transition } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "#/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { match } from "ts-pattern";

/**
 * What Poof is doing right now. Only states that actually occur are modelled: a
 * settled or failed turn drops the mark entirely rather than resting in place.
 */
export type PoofMarkState = "thinking" | "working" | "writing";

export type PoofMarkTool = "contact_lucien" | "download_resume" | "link_work_entry";

/**
 * What the mark draws. `working` fans out per tool, because the status text beside the
 * mark names the tool, and a face visibly doing something else reads as a second,
 * contradictory story about the same moment.
 */
type Depiction = "fetching" | "finding" | "sending" | "thinking" | "writing";

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Where each eye looks. Every job has a different focus, and gaze is the cheapest cue. */
const GAZE: Record<Depiction, { x: number; y: number }> = {
  fetching: { x: 2.5, y: -2 },
  finding: { x: 0, y: 0 },
  sending: { x: 2, y: -3 },
  thinking: { x: 2, y: -3 },
  writing: { x: -1.5, y: 2.5 },
};

/** Head tilt, degrees. Cocked toward the thought bubble; leaning over the page. */
const TILT: Record<Depiction, number> = { fetching: 0, finding: 0, sending: 0, thinking: 6, writing: -4 };

/** Thought dots trail up and to the right: cx, cy, r, stagger. */
const THOUGHT_DOTS: ReadonlyArray<readonly [number, number, number, number]> = [
  [38, 8, 1.6, 0],
  [41.5, 5, 2, 0.25],
  [45, 2.5, 2.4, 0.5],
];

/**
 * Poof's face. A chamfered square in the monogram's construction language with two
 * pill eyes, and a prop per job so it visibly does what the status text says: thought
 * dots while thinking, a pencil while writing, and for tool calls a magnifier, a page
 * pulled from behind the head, or a paper plane.
 *
 * Every animation is transform or opacity only, so a streaming reply never pays for a
 * layout pass. Decorative on purpose: the status text beside it already carries the
 * state for assistive tech.
 */
export function PoofMark({
  className,
  state,
  tool,
}: {
  className?: string;
  state: PoofMarkState;
  tool?: PoofMarkTool;
}) {
  const still = useReducedMotion() ?? false;

  const depiction = match<{ state: PoofMarkState; tool?: PoofMarkTool }, Depiction>({ state, tool })
    .with({ state: "thinking" }, () => "thinking")
    .with({ state: "writing" }, () => "writing")
    .with({ tool: "download_resume" }, () => "fetching")
    .with({ tool: "contact_lucien" }, () => "sending")
    .otherwise(() => "finding");

  // Under reduced motion every loop collapses to its resting pose. The props stay, so each
  // state is still legible; only the movement goes.
  const pose = (moving: TargetAndTransition, rest: TargetAndTransition) => (still ? rest : moving);
  const loop = (transition: Transition): Transition => (still ? { duration: 0 } : { repeat: Infinity, ...transition });

  // Props cross-fade when the job changes rather than popping, which otherwise reads as a glitch.
  // The AnimatePresence around them must NOT get `initial={false}`: that resolves a child's
  // keyframe `animate` to its first frame and treats it as settled, which froze the thought dots
  // at opacity 0 on first render while props that entered later animated normally.
  const prop = (key: Depiction, children: ReactNode) => (
    <motion.g
      key={key}
      data-slot="poof-mark-prop"
      data-prop={key}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: still ? 0 : 0.18 }}
    >
      {children}
    </motion.g>
  );

  // Finding: eyes and the lens sweep together, so the ring stays a monocle on the right eye.
  const sweep = pose({ x: [-3, 3, -3] }, { x: 0 });
  const sweepTiming = loop({ duration: 1.8, ease: "easeInOut" });

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      className={cn("size-14 shrink-0 overflow-visible", className)}
      data-slot="poof-mark"
      data-state={state}
      data-depiction={depiction}
      aria-hidden="true"
      initial={still ? false : { opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.24, ease: EASE_OUT }}
    >
      {/* Behind the body, so the page is hidden until it rises into view. */}
      <AnimatePresence>
        {depiction === "fetching"
          ? prop(
              "fetching",
              <motion.g
                animate={pose({ x: [24, 35], y: [24, 9] }, { x: 35, y: 9 })}
                transition={loop({ duration: 0.8, ease: EASE_OUT, repeatDelay: 0.9 })}
              >
                <rect className="fill-background stroke-foreground" width="11" height="14" rx="1" strokeWidth="1.6" />
                <path className="fill-foreground" d="M7 0l4 4H7z" />
                <rect className="fill-foreground" x="2.5" y="6.5" width="6" height="1.4" rx="0.7" />
                <rect className="fill-foreground" x="2.5" y="9.5" width="4.5" height="1.4" rx="0.7" />
              </motion.g>,
            )
          : null}
      </AnimatePresence>

      <motion.path
        className="fill-primary"
        d="M14 10h20l4 4v20l-4 4H14l-4-4V14z"
        animate={{ rotate: TILT[depiction] }}
        transition={{ duration: 0.4, ease: EASE_OUT }}
      />

      <motion.g
        animate={depiction === "finding" ? sweep : GAZE[depiction]}
        transition={depiction === "finding" ? sweepTiming : { duration: 0.35, ease: EASE_OUT }}
      >
        {[17.4, 27.4].map((x) => (
          <motion.rect
            key={x}
            className="fill-primary-foreground"
            data-slot="poof-mark-eye"
            x={x}
            y="19.5"
            width="3.2"
            height="9"
            rx="1.6"
            animate={pose({ scaleY: [1, 1, 0.1, 1] }, { scaleY: 1 })}
            transition={loop({ duration: 4.2, ease: "easeInOut", times: [0, 0.92, 0.96, 1] })}
          />
        ))}
      </motion.g>

      <AnimatePresence>
        {match(depiction)
          .with("thinking", () =>
            prop(
              "thinking",
              <>
                {THOUGHT_DOTS.map(([cx, cy, r, delay]) => (
                  <motion.circle
                    key={cx}
                    className="fill-primary"
                    cx={cx}
                    cy={cy}
                    r={r}
                    animate={pose({ opacity: [0, 1, 1, 0], scale: [0.5, 1, 1, 0.5] }, { opacity: 1, scale: 1 })}
                    transition={loop({ delay, duration: 1.8, ease: "easeInOut", times: [0, 0.15, 0.6, 0.8] })}
                  />
                ))}
              </>,
            ),
          )
          .with("writing", () =>
            prop(
              "writing",
              // Outer group drifts along the line and snaps back (a carriage return); inner
              // group jitters the tip, which is what makes it read as letters rather than a slide.
              <motion.g animate={pose({ x: [-3, 3] }, { x: 0 })} transition={loop({ duration: 1.2, ease: "linear" })}>
                <motion.g
                  animate={pose({ y: [0, -0.9, 0] }, { y: 0 })}
                  transition={loop({ duration: 0.14, ease: "easeInOut" })}
                >
                  <g transform="translate(10 42) rotate(38)">
                    <path className="fill-foreground" d="M0 0l-1.7-3.8h3.4z" />
                    <rect className="fill-foreground" x="-1.7" y="-16" width="3.4" height="12.2" />
                    <rect className="fill-primary" x="-1.7" y="-18.4" width="3.4" height="2.4" rx="0.6" />
                  </g>
                </motion.g>
              </motion.g>,
            ),
          )
          .with("finding", () =>
            prop(
              "finding",
              <motion.g animate={sweep} transition={sweepTiming}>
                <circle className="stroke-foreground" cx="29" cy="24" r="5.6" fill="none" strokeWidth="2.2" />
                <line
                  className="stroke-foreground"
                  x1="33"
                  y1="28"
                  x2="39.5"
                  y2="34.5"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />
              </motion.g>,
            ),
          )
          .with("sending", () =>
            prop(
              "sending",
              <motion.g
                animate={pose({ opacity: [1, 1, 0], x: [0, 6, 10], y: [0, -8, -13] }, { opacity: 1, x: 5, y: -6 })}
                transition={loop({ duration: 1.4, ease: "easeOut", repeatDelay: 0.5, times: [0, 0.6, 1] })}
              >
                <g transform="translate(31 22) rotate(-30)">
                  <path className="fill-foreground" d="M0 9.9L11.55 4.95L0 0v3.85L8.25 4.95L0 6.05z" />
                </g>
              </motion.g>,
            ),
          )
          .with("fetching", () => null)
          .exhaustive()}
      </AnimatePresence>
    </motion.svg>
  );
}
