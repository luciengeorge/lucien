import type { Resume, ResumeExperience } from "./schema";

import resumeJson from "../../../content/resume.json";
import { ResumeSchema } from "./schema";

let cached: Resume | undefined;

export function loadResume(): Resume {
  if (cached) return cached;
  cached = ResumeSchema.parse(resumeJson);
  return cached;
}

export function formatPeriod(start: string, end: string | null) {
  const startLabel = formatMonth(start);
  const endLabel = end ? formatMonth(end) : "Present";
  return `${startLabel} – ${endLabel}`;
}

export function formatExperienceSpan(experience: ResumeExperience) {
  const starts = experience.roles.map((role) => role.start).filter(Boolean);
  const ends = experience.roles.map((role) => role.end);
  const earliestStart = [...starts].sort()[0] ?? "";
  const hasOngoing = ends.some((end) => end === null);
  const latestEnd = hasOngoing
    ? null
    : (ends
        .filter((end): end is string => Boolean(end))
        .sort()
        .at(-1) ?? null);
  return formatPeriod(earliestStart, latestEnd);
}

function formatMonth(value: string) {
  if (/^\d{4}$/.test(value)) return value;
  const [year, month] = value.split("-");
  if (!year || !month) return value;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
  return date.toLocaleString("en-US", { month: "short", timeZone: "UTC", year: "numeric" });
}
