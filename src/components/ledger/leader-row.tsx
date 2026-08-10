import type { ReactNode } from "react";

import { cn } from "#/lib/utils";

/**
 * The dotted-leader row, which is the one shape this direction repeats.
 *
 * A leader earns its place only where a label reaches a value across a gap:
 * a company reaching its dates, a file reaching its format, a term reaching
 * its figure. Rows that are just a list of things get no leader, because
 * there is nothing on the right for the eye to arrive at.
 *
 * The value never wraps. It is the right-aligned edge of a column of rows, so
 * a second line there knocks every row below it out of alignment.
 */
interface LeaderRowProps {
  className?: string;
  label: ReactNode;
  /** Rendered after the value: an arrow, a download link, a state chip. */
  trailing?: ReactNode;
  value: ReactNode;
  valueClassName?: string;
}

export function LeaderRow({ className, label, trailing, value, valueClassName }: LeaderRowProps) {
  return (
    <div className={cn("flex items-baseline gap-3.5", className)}>
      <span className="shrink-0 font-mono text-[11px] tracking-[0.14em] text-label">{label}</span>
      <span aria-hidden className="leader" />
      <span className={cn("shrink-0 font-mono text-[13px] whitespace-nowrap text-ink", valueClassName)}>{value}</span>
      {trailing}
    </div>
  );
}

/**
 * The rail's running account. A description list rather than a stack of divs:
 * these genuinely are terms and their values, and the markup is what lets a
 * screen reader read "current, Fyxer" instead of two loose strings.
 */
export function RailStats({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-mono text-[11px] tracking-[0.3em] text-label">{label}</p>
      <dl className="flex flex-col gap-2.5">{children}</dl>
    </div>
  );
}

export function RailStat({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex items-baseline gap-3">
      <dt className="shrink-0 font-mono text-[11px] tracking-[0.14em] text-label">{label}</dt>
      <span aria-hidden className="leader" />
      <dd className="m-0 shrink-0 font-mono text-[12px] whitespace-nowrap text-ink">{value}</dd>
    </div>
  );
}
