import { cn } from "#/lib/utils";
import { motion, useReducedMotion } from "motion/react";

/**
 * How often each tool actually shows up in the work, rather than a self-scored
 * proficiency chart nobody believes.
 *
 * The cadence word beside each label is the fact; the bar is the same fact
 * drawn, so the bar is `aria-hidden` and the list reads perfectly well with
 * every graphic stripped out.
 */
export interface FrequencyBand {
  cadence: string;
  label: string;
  /** Share of the bar's track, 0 to 1. */
  share: number;
}

export const FREQUENCY_BANDS: readonly FrequencyBand[] = [
  { cadence: "daily", label: "TypeScript", share: 1 },
  { cadence: "daily", label: "React", share: 0.92 },
  { cadence: "weekly", label: "Convex", share: 0.7 },
  { cadence: "occasional", label: "Ruby on Rails", share: 0.42 },
  { cadence: "when needed", label: "Swift · Kotlin", share: 0.26 },
];

const STAGGER = 0.08;

export function FrequencyPlot({ className }: { className?: string }) {
  const reduced = useReducedMotion();

  return (
    <ul className={cn("flex flex-col gap-[1.375rem]", className)}>
      {FREQUENCY_BANDS.map((band, index) => (
        <li className="flex flex-col gap-[0.4375rem]" key={band.label}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-mono text-xs font-medium text-ink">{band.label}</span>
            <span className="font-mono text-[11px] text-label">{band.cadence}</span>
          </div>
          <span aria-hidden="true" className="block h-2 w-full bg-paper-shade" data-slot="frequency-bar">
            <motion.span
              className="block h-2 bg-ink"
              initial={reduced ? { opacity: 1 } : { scaleX: 0 }}
              style={{ transformOrigin: "left", width: `${band.share * 100}%` }}
              transition={reduced ? { duration: 0 } : { delay: index * STAGGER, duration: 0.55, ease: "easeOut" }}
              viewport={{ amount: 0.6, once: true }}
              whileInView={reduced ? { opacity: 1 } : { scaleX: 1 }}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}
