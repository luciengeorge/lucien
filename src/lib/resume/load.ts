import { differenceInMonths, format, parse } from "date-fns";

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
  const startLabel = formatMonthYear(start);
  const endLabel = end ? formatMonthYear(end) : "Present";
  return `${startLabel} – ${endLabel}`;
}

export function formatDuration(start: string, end: string | null) {
  const startDate = parseDate(start);
  if (!startDate) return "";
  const endDate = end ? (parseDate(end) ?? new Date()) : new Date();

  const months = Math.max(0, differenceInMonths(endDate, startDate) + 1);
  if (months < 1) return "Less than a month";

  const years = Math.floor(months / 12);
  const remMonths = months % 12;

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} yr${years === 1 ? "" : "s"}`);
  if (remMonths > 0) parts.push(`${remMonths} mo${remMonths === 1 ? "" : "s"}`);
  if (parts.length === 0) parts.push("1 mo");
  return parts.join(" ");
}

export function formatExperienceDuration(experience: ResumeExperience) {
  const starts = experience.roles.map((role) => role.start).filter(Boolean);
  const earliestStart = [...starts].sort()[0];
  if (!earliestStart) return "";

  const hasOngoing = experience.roles.some((role) => role.end === null);
  const latestEnd = hasOngoing
    ? null
    : (experience.roles
        .map((role) => role.end)
        .filter((end): end is string => Boolean(end))
        .sort()
        .at(-1) ?? null);
  return formatDuration(earliestStart, latestEnd);
}

function parseDate(value: string) {
  if (/^\d{4}$/.test(value)) return parse(value, "yyyy", new Date());
  if (/^\d{4}-\d{2}$/.test(value)) return parse(value, "yyyy-MM", new Date());
  return undefined;
}

function formatMonthYear(value: string) {
  if (/^\d{4}$/.test(value)) return value;
  const parsed = parseDate(value);
  if (!parsed) return value;
  return format(parsed, "MMM yyyy");
}
