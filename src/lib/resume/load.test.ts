import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ResumeExperience } from "./schema";

import { companyInitials, formatDuration, formatExperienceDuration, formatPeriod, loadResume } from "./load";

const FIXED_NOW = new Date("2026-06-15T00:00:00Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("loadResume", () => {
  it("loads and validates content/resume.json", () => {
    const resume = loadResume();
    expect(resume.personal.name).toBe("Lucien George");
    expect(resume.experiences.length).toBeGreaterThan(0);
    expect(resume.skills.programming).toContain("TypeScript");
  });

  it("returns the same cached instance on repeated calls", () => {
    expect(loadResume()).toBe(loadResume());
  });
});

describe("formatPeriod", () => {
  it("formats yyyy-MM ranges into 'Mon yyyy – Mon yyyy'", () => {
    expect(formatPeriod("2022-01", "2023-05")).toBe("Jan 2022 – May 2023");
  });

  it("renders 'Present' for null end date", () => {
    expect(formatPeriod("2025-09", null)).toBe("Sep 2025 – Present");
  });

  it("keeps year-only values as-is", () => {
    expect(formatPeriod("2017", "2017")).toBe("2017 – 2017");
  });

  it("falls back to the raw value for unrecognised formats", () => {
    expect(formatPeriod("bogus", "bogus")).toBe("bogus – bogus");
  });
});

describe("formatDuration", () => {
  it("returns N yrs M mos for multi-year spans", () => {
    expect(formatDuration("2020-01", "2022-03")).toBe("2 yrs 3 mos");
  });

  it("uses singular yr / mo when count is 1", () => {
    expect(formatDuration("2020-01", "2021-02")).toBe("1 yr 2 mos");
    expect(formatDuration("2020-01", "2020-02")).toBe("2 mos");
  });

  it("counts to now when end is null", () => {
    expect(formatDuration("2025-09", null)).toBe("10 mos");
  });

  it("returns empty string for unparseable start", () => {
    expect(formatDuration("not-a-date", null)).toBe("");
  });

  it("renders 1 mo when months < 1", () => {
    expect(formatDuration("2026-06", "2026-06")).toBe("1 mo");
  });
});

describe("formatExperienceDuration", () => {
  it("collapses multiple roles to the full span (earliest start → latest end)", () => {
    const exp: ResumeExperience = {
      company: "Acme",
      roles: [
        { role: "B", start: "2021-01", end: "2022-01", bullets: ["x"] },
        { role: "A", start: "2020-01", end: "2021-01", bullets: ["x"] },
      ],
    };
    expect(formatExperienceDuration(exp)).toBe("2 yrs 1 mo");
  });

  it("treats any ongoing role as latest end = present", () => {
    const exp: ResumeExperience = {
      company: "Acme",
      roles: [
        { role: "Past", start: "2023-01", end: "2024-01", bullets: ["x"] },
        { role: "Current", start: "2024-01", end: null, bullets: ["x"] },
      ],
    };
    const result = formatExperienceDuration(exp);
    expect(result).toMatch(/yrs?|mos?/);
    expect(result).not.toBe("");
  });

  it("returns empty string when no role has a start", () => {
    const exp: ResumeExperience = {
      company: "Acme",
      roles: [{ role: "X", start: "", end: null, bullets: ["x"] }],
    };
    expect(formatExperienceDuration(exp)).toBe("");
  });
});

describe("companyInitials", () => {
  it("returns the first letter of the first two words, uppercased", () => {
    expect(companyInitials("Hoxton Digital")).toBe("HD");
    expect(companyInitials("le wagon")).toBe("LW");
  });

  it("works for single-word companies", () => {
    expect(companyInitials("Fyxer")).toBe("F");
  });

  it("caps at 2 initials regardless of word count", () => {
    expect(companyInitials("A B C D")).toBe("AB");
  });

  it("collapses multiple spaces", () => {
    expect(companyInitials("Le   Wagon")).toBe("LW");
  });
});
