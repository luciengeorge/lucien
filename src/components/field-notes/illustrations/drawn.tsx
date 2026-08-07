import type { ReactNode } from "react";

import { cn } from "#/lib/utils";
import { motion, useReducedMotion } from "motion/react";

/**
 * The drawing primitives behind every Field Notes illustration.
 *
 * The conceit is that a hand drew these in the margin, so they animate by
 * being *drawn*: `pathLength` runs 0 -> 1 and the stroke appears to travel
 * along the line. That is a genuine SVG geometry animation, not a transform,
 * which means the global `MotionConfig reducedMotion="user"` does NOT strip it
 * for us - every component here checks `useReducedMotion` itself and renders
 * the finished drawing instead.
 *
 * Everything draws once, when scrolled into view, and never replays.
 */

export const DRAW_VIEWPORT = { amount: 0.4, once: true } as const;

/** Ink first, then the rust annotation on top of it, the way a hand would. */
export const INK_DURATION = 0.9;
export const ANNOTATION_DELAY = INK_DURATION * 0.7;

/** Quick off the mark, long settle - a stroke leaving the nib and running out. */
const DRAW_EASE: [number, number, number, number] = [0.32, 0.72, 0.35, 1];

interface DrawnFigureProps {
  children: ReactNode;
  className?: string;
  /** Decorative figures are hidden from assistive tech; labelled ones are not. */
  decorative?: boolean;
  height?: number;
  label?: string;
  viewBox: string;
  width?: number;
}

export function DrawnFigure({
  children,
  className,
  decorative = false,
  height,
  label,
  viewBox,
  width,
}: DrawnFigureProps) {
  const a11y = decorative ? { "aria-hidden": true } : { "aria-label": label, role: "img" };

  return (
    <motion.svg
      className={cn("overflow-visible", className)}
      fill="none"
      height={height}
      initial="hidden"
      viewBox={viewBox}
      whileInView="visible"
      viewport={DRAW_VIEWPORT}
      width={width}
      xmlns="http://www.w3.org/2000/svg"
      {...a11y}
    >
      {children}
    </motion.svg>
  );
}

interface DrawnPathProps {
  className?: string;
  d: string;
  /** Seconds to wait before this stroke starts, so strokes land in drawing order. */
  delay?: number;
  duration?: number;
  stroke?: string;
  strokeDasharray?: string;
  strokeWidth?: number;
}

export function DrawnPath({
  className,
  d,
  delay = 0,
  duration = INK_DURATION,
  stroke = "currentColor",
  strokeDasharray,
  strokeWidth = 2,
}: DrawnPathProps) {
  const reduced = useReducedMotion();

  /*
   * Motion animates `pathLength` by writing stroke-dasharray and
   * stroke-dashoffset onto the element. A path that already carries its own
   * dash pattern therefore cannot also be drawn - the two settings collide and
   * the dashes vanish mid-animation. Dashed strokes fade in instead, which is
   * the right read anyway: a dotted route is a thing you annotate onto a map,
   * not a line you sweep out in one stroke.
   */
  const isDashed = strokeDasharray !== undefined;

  const variants = isDashed
    ? { hidden: { opacity: reduced ? 1 : 0 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: reduced ? 1 : 0, pathLength: reduced ? 1 : 0 },
        visible: { opacity: 1, pathLength: 1 },
      };

  const transition = reduced
    ? { duration: 0 }
    : isDashed
      ? { delay, duration: duration * 0.6 }
      : { delay, duration, ease: DRAW_EASE, opacity: { delay, duration: 0.12 } };

  return (
    <motion.path
      className={className}
      d={d}
      fill="none"
      stroke={stroke}
      strokeDasharray={strokeDasharray}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      variants={variants}
      transition={transition}
    />
  );
}

interface DrawnCircleProps {
  className?: string;
  cx: number;
  cy: number;
  delay?: number;
  duration?: number;
  fill?: string;
  r: number;
  stroke?: string;
  strokeWidth?: number;
}

/**
 * A circled point - the mark you make when you want to come back to something.
 * Filled circles pop in rather than draw, because a dot has no path to travel.
 */
export function DrawnCircle({
  className,
  cx,
  cy,
  delay = 0,
  duration = 0.5,
  fill = "none",
  r,
  stroke = "currentColor",
  strokeWidth = 2,
}: DrawnCircleProps) {
  const reduced = useReducedMotion();
  const isFilled = fill !== "none";

  if (isFilled) {
    return (
      <motion.circle
        className={className}
        cx={cx}
        cy={cy}
        fill={fill}
        r={r}
        variants={{
          hidden: { opacity: reduced ? 1 : 0, scale: reduced ? 1 : 0 },
          visible: { opacity: 1, scale: 1 },
        }}
        style={{ originX: `${cx}px`, originY: `${cy}px` }}
        transition={reduced ? { duration: 0 } : { bounce: 0.5, delay, type: "spring", visualDuration: 0.35 }}
      />
    );
  }

  return (
    <motion.circle
      className={className}
      cx={cx}
      cy={cy}
      fill="none"
      r={r}
      stroke={stroke}
      strokeLinecap="round"
      strokeWidth={strokeWidth}
      variants={{
        hidden: { opacity: reduced ? 1 : 0, pathLength: reduced ? 1 : 0 },
        visible: { opacity: 1, pathLength: 1 },
      }}
      transition={reduced ? { duration: 0 } : { delay, duration, ease: "easeInOut", opacity: { delay, duration: 0.1 } }}
    />
  );
}

interface DrawnRectProps {
  className?: string;
  delay?: number;
  duration?: number;
  height: number;
  rx?: number;
  stroke?: string;
  strokeDasharray?: string;
  strokeWidth?: number;
  width: number;
  x: number;
  y: number;
}

export function DrawnRect({
  className,
  delay = 0,
  duration = INK_DURATION,
  height,
  rx = 3,
  stroke = "currentColor",
  strokeDasharray,
  strokeWidth = 1.8,
  width,
  x,
  y,
}: DrawnRectProps) {
  const reduced = useReducedMotion();

  // Same collision as DrawnPath: pathLength is implemented with dasharray, so a
  // rect that is meant to *stay* dashed has to fade in rather than draw.
  const isDashed = strokeDasharray !== undefined;

  const variants = isDashed
    ? { hidden: { opacity: reduced ? 1 : 0 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: reduced ? 1 : 0, pathLength: reduced ? 1 : 0 },
        visible: { opacity: 1, pathLength: 1 },
      };

  const transition = reduced
    ? { duration: 0 }
    : isDashed
      ? { delay, duration: duration * 0.6 }
      : { delay, duration, ease: DRAW_EASE, opacity: { delay, duration: 0.12 } };

  return (
    <motion.rect
      className={className}
      fill="none"
      height={height}
      rx={rx}
      stroke={stroke}
      strokeDasharray={strokeDasharray}
      strokeLinecap="round"
      strokeWidth={strokeWidth}
      width={width}
      x={x}
      y={y}
      variants={variants}
      transition={transition}
    />
  );
}

interface DrawnLabelProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  x: number;
  y: number;
}

/** Text inside a figure fades up rather than drawing; letters do not get penned. */
export function DrawnLabel({ children, className, delay = 0, x, y }: DrawnLabelProps) {
  return (
    <motion.text
      className={className}
      x={x}
      y={y}
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
      transition={{ delay, duration: 0.35 }}
    >
      {children}
    </motion.text>
  );
}
