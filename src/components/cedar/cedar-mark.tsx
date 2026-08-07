import { cn } from "#/lib/utils";
import { motion, useReducedMotion } from "motion/react";

/**
 * The cedar. Lebanon's tree, and the one mark this direction needs.
 *
 * It sits behind the page as a watermark at low opacity rather than as an
 * illustration beside the text: heritage should be the ground you are standing
 * on, not a logo pointed at you. Decorative by definition, so it is hidden
 * from assistive tech.
 */
const CEDAR_PATH =
  "M50 6 L58 30 L52 30 L62 50 L54 50 L66 72 L52 72 L52 94 L48 94 L48 72 L34 72 L46 50 L38 50 L48 30 L42 30 Z";

export function CedarMark({ className }: { className?: string }) {
  const reduced = useReducedMotion();

  return (
    <motion.svg
      aria-hidden
      className={cn("text-cedar", className)}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 0.16 }}
      viewport={{ amount: 0.2, once: true }}
      transition={reduced ? { duration: 0 } : { duration: 1.1, ease: "easeOut" }}
    >
      <path d={CEDAR_PATH} fill="currentColor" />
    </motion.svg>
  );
}

/**
 * The route line: Beirut outward. Cedar green, small, and stated as fact.
 * This is the direction's signature label, so it appears on every page.
 */
export function RouteLabel({ className }: { className?: string }) {
  return <span className={cn("font-mono text-[11px] tracking-[0.18em] text-cedar", className)}>BEIRUT → LONDON</span>;
}

/** Three languages, one builder. Terracotta, and the only place it appears in the header. */
export function LanguagesLabel({ className }: { className?: string }) {
  return <span className={cn("font-mono text-xs text-terracotta", className)}>FR · EN · AR</span>;
}
