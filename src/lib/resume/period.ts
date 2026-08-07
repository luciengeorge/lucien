const YEAR = /\d{4}/;

/**
 * Compresses a work period ("Sep 2025 - Present") down to the years either side
 * ("2025 · now"), so the printed CV keeps a narrow right-aligned date rail
 * instead of a second body column competing with the roles.
 */
export function compressPeriod(period: string): string {
  const [start, end] = period.split(" - ");
  if (!start || !end) return period;

  const startYear = YEAR.exec(start)?.[0];
  if (!startYear) return period;

  const endYear = /present/i.test(end) ? "now" : YEAR.exec(end)?.[0];
  if (!endYear) return period;

  return `${startYear} · ${endYear}`;
}
