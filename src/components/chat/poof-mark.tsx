import type { Variants } from "motion/react";
import type { CSSProperties } from "react";

import { cn } from "#/lib/utils";
import { motion, useReducedMotion } from "motion/react";

/**
 * What Poof is doing right now. Only states that actually occur are modelled: a
 * settled or failed turn drops the mark entirely rather than resting in place.
 */
export type PoofMarkState = "speaking" | "thinking" | "working";

/**
 * Poof's face. Built from the monogram's construction language (a chamfered
 * square, flat fill) rather than a rounded blob, so it sits with the rest of the
 * site. All personality is in the motion, and all of it is transform-only so the
 * mark never costs a layout pass while a reply streams.
 *
 * Decorative on purpose: the status text beside it already carries the state for
 * assistive tech, so announcing here would just duplicate it.
 */
export function PoofMark({ className, state }: { className?: string; state: PoofMarkState }) {
  const shouldReduceMotion = useReducedMotion();

  // Under reduced motion each state collapses to its resting pose. Eye shape still
  // separates thinking (squint) from working and speaking (open), so the state stays
  // legible without anything moving.
  const bodyVariants: Variants = {
    speaking: shouldReduceMotion
      ? { y: 0 }
      : { transition: { duration: 1.9, ease: "easeInOut", repeat: Infinity }, y: [0, -0.8, 0] },
    thinking: shouldReduceMotion
      ? { rotate: 0 }
      : { rotate: [-5, 5, -5], transition: { duration: 2.6, ease: "easeInOut", repeat: Infinity } },
    working: { rotate: 0, y: 0 },
  };

  const eyeVariants: Variants = {
    speaking: shouldReduceMotion
      ? { scaleY: 1, x: 0 }
      : {
          // Blinks late in a long cycle, so it reads as a tic rather than a pulse.
          scaleY: [1, 1, 0.12, 1],
          transition: { duration: 4.2, ease: "easeInOut", repeat: Infinity, times: [0, 0.9, 0.945, 1] },
          x: 0,
        },
    thinking: { scaleY: 0.42, x: 0 },
    working: shouldReduceMotion
      ? { scaleY: 1, x: 0 }
      : {
          // Glancing side to side: the tool call is Poof looking something up.
          scaleY: 1,
          transition: { duration: 1.7, ease: "easeInOut", repeat: Infinity },
          x: [-1.5, 1.5, -1.5],
        },
  };

  // SVG transforms default to the user-space origin, so scaling an eye without this
  // would sweep it across the face instead of squinting it in place.
  const eyeStyle: CSSProperties = { transformBox: "fill-box", transformOrigin: "center" };

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={cn("size-4 shrink-0", className)}
      data-slot="poof-mark"
      data-state={state}
      aria-hidden="true"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.g style={eyeStyle} variants={bodyVariants} animate={state}>
        {/* Chamfer is ~15% of the side: the monogram's 11% disappears at 16px, and much
            more than this stops reading as a cut square and starts reading as an octagon. */}
        <path className="fill-primary" d="M3.5 0h17l3.5 3.5v17L20.5 24h-17L0 20.5v-17z" />
        <motion.rect
          className="fill-primary-foreground"
          data-slot="poof-mark-eye"
          x="7.8"
          y="8.5"
          width="2.4"
          height="7"
          rx="1.2"
          style={eyeStyle}
          variants={eyeVariants}
          animate={state}
        />
        <motion.rect
          className="fill-primary-foreground"
          data-slot="poof-mark-eye"
          x="13.8"
          y="8.5"
          width="2.4"
          height="7"
          rx="1.2"
          style={eyeStyle}
          variants={eyeVariants}
          animate={state}
        />
      </motion.g>
    </motion.svg>
  );
}
