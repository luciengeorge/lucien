import { WORK_META } from "#/lib/content/work-meta";
import { workSlugForCompany } from "#/lib/work-slug-for-company";
import { describe, expect, it } from "vitest";

import type { ResumeExperience } from "./schema";

import { loadResume } from "./load";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Sep 2025" -> "2025-09", "2019" -> "2019", "Present" -> null. */
function toResumeDate(label: string): string | null {
  if (label === "Present") return null;
  if (/^\d{4}$/.test(label)) return label;
  const [month = "", year = ""] = label.split(" ");
  const index = MONTHS.indexOf(month);
  if (index === -1 || !/^\d{4}$/.test(year)) throw new Error(`Unrecognised period label "${label}"`);
  return `${year}-${String(index + 1).padStart(2, "0")}`;
}

function parsePeriod(period: string): { start: string; end: string | null } {
  const [start, end] = period.split(" - ");
  if (!start || !end) throw new Error(`Unrecognised period "${period}"`);
  const parsedStart = toResumeDate(start);
  if (parsedStart === null) throw new Error(`Period "${period}" cannot start at Present`);
  return { start: parsedStart, end: toResumeDate(end) };
}

/** Truncates a resume date to the precision the work-history label uses ("2019" vs "2019-04"). */
function atPrecisionOf(value: string, reference: string): string {
  return value.slice(0, reference.length);
}

function span(experience: ResumeExperience): { start: string; end: string | null } {
  const start = experience.roles.map((role) => role.start).sort()[0] ?? "";
  const ongoing = experience.roles.some((role) => role.end === null);
  const end = ongoing
    ? null
    : (experience.roles
        .map((role) => role.end)
        .filter((value): value is string => value !== null)
        .sort()
        .at(-1) ?? null);
  return { start, end };
}

/*
 * /work (work-meta.ts and the markdown it summarises) is the primary work
 * history; content/resume.json is a curated, one-page cut of it. The resume
 * may leave out an early role, so it can start later than the work entry, but
 * it must never end on a different date or call a current role finished.
 */
describe("resume.json agrees with the work history", () => {
  const { experiences } = loadResume();

  it("maps every resume experience to a work entry, and covers every work entry", () => {
    const slugs = experiences.map((experience) => workSlugForCompany(experience.company));
    expect(slugs).not.toContain(undefined);
    expect(new Set(slugs)).toEqual(new Set(WORK_META.map((meta) => meta.slug)));
  });

  for (const experience of experiences) {
    const meta = WORK_META.find((entry) => entry.slug === workSlugForCompany(experience.company));

    it(`${experience.company} ends when /work says it does`, () => {
      if (!meta) throw new Error(`No work entry for ${experience.company}`);
      const period = parsePeriod(meta.period);
      const { end } = span(experience);
      if (period.end === null) {
        expect(end, `/work says ${meta.company} is ongoing (${meta.period})`).toBeNull();
      } else {
        expect(end, `/work says ${meta.company} ended (${meta.period})`).not.toBeNull();
        expect(atPrecisionOf(end ?? "", period.end)).toBe(period.end);
      }
    });

    it(`${experience.company} starts no earlier than /work says it does`, () => {
      if (!meta) throw new Error(`No work entry for ${experience.company}`);
      const period = parsePeriod(meta.period);
      const { start } = span(experience);
      expect(atPrecisionOf(start, period.start) >= period.start, `${start} precedes ${meta.period}`).toBe(true);
    });
  }
});
