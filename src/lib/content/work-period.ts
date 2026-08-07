/**
 * Presentation helpers for the `period` strings in `WORK_META`.
 *
 * Those are authored as "Sep 2025 - Present", "Jan 2022 - Sep 2023" or a bare
 * "2019". Knowing that shape is this module's job and nowhere else's: the
 * pages differ only in how much of it they print, so they share one parse and
 * pick a formatter.
 */

const RANGE = /\s+-\s+/;
const YEAR = /\d{4}/;

interface ParsedPeriod {
  end: string | null;
  isPresent: boolean;
  start: string;
}

function parsePeriod(period: string): ParsedPeriod {
  const [start, end] = period.split(RANGE);
  return {
    end: end ?? null,
    isPresent: end !== undefined && /present/i.test(end),
    start,
  };
}

/**
 * Full range, journal-styled: "Sep 2025 - Present" becomes "Sep 2025 · present".
 * The register never prints a hyphen rule and never shouts.
 */
export function formatWorkPeriod(period: string): string {
  const { end, isPresent, start } = parsePeriod(period);
  if (end === null) return start;
  return `${start} · ${isPresent ? "present" : end}`;
}

/** The collection date: the leading end of the range. */
export function workPeriodStart(period: string): string {
  return parsePeriod(period).start;
}

/**
 * Years only: "Sep 2025 - Present" becomes "2025 · now". Keeps the printed CV's
 * right-aligned date rail narrow instead of letting it compete with the roles.
 * Anything that does not parse as a year range is returned untouched.
 */
export function compressWorkPeriod(period: string): string {
  const { end, isPresent, start } = parsePeriod(period);
  if (end === null) return period;

  const startYear = YEAR.exec(start)?.[0];
  if (!startYear) return period;

  const endYear = isPresent ? "now" : YEAR.exec(end)?.[0];
  if (!endYear) return period;

  return `${startYear} · ${endYear}`;
}
