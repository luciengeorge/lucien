/**
 * Presentation helpers for the `period` strings in `WORK_META`, which are
 * authored as "Sep 2025 - Present". The journal never prints a hyphen rule and
 * never shouts, so the register renders "Sep 2025 · present" instead.
 */

const RANGE = /\s+-\s+/;

export function formatWorkPeriod(period: string): string {
  return period
    .split(RANGE)
    .map((part) => (part.toLowerCase() === "present" ? "present" : part))
    .join(" · ");
}

/** The collection date: the leading end of the range. */
export function workPeriodStart(period: string): string {
  return period.split(RANGE)[0];
}
