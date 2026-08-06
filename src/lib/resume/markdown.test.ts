import { describe, expect, it } from "vitest";

import type { Resume } from "./schema";

import resumeJson from "../../../content/resume.json";
import { renderResumeMarkdown } from "./markdown";
import { ResumeSchema } from "./schema";

const resume = ResumeSchema.parse(resumeJson);

describe("renderResumeMarkdown", () => {
  it("renders the personal header: name, title, email, phone, location", () => {
    const md = renderResumeMarkdown(resume);
    expect(md).toContain(resume.personal.name);
    expect(md).toContain(resume.personal.title);
    expect(md).toContain(resume.personal.email);
    expect(md).toContain(resume.personal.location);
    if (resume.personal.phone) expect(md).toContain(resume.personal.phone);
  });

  it("renders personal links (github, linkedin, website)", () => {
    const md = renderResumeMarkdown(resume);
    if (resume.personal.links.github) expect(md).toContain(resume.personal.links.github);
    if (resume.personal.links.linkedin) expect(md).toContain(resume.personal.links.linkedin);
    if (resume.personal.website) expect(md).toContain(resume.personal.website);
  });

  it("renders an Education section with every school, degree, location, and note", () => {
    const md = renderResumeMarkdown(resume);
    expect(md).toContain("## Education");
    for (const entry of resume.education) {
      expect(md).toContain(entry.school);
      expect(md).toContain(entry.degree);
      expect(md).toContain(entry.location);
      expect(md).toContain(entry.start);
      expect(md).toContain(entry.end);
      if (entry.note) expect(md).toContain(entry.note);
    }
  });

  it("renders a Skills section with every programming language and spoken language", () => {
    const md = renderResumeMarkdown(resume);
    expect(md).toContain("## Skills");
    for (const skill of resume.skills.programming) expect(md).toContain(skill);
    for (const language of resume.skills.spokenLanguages) expect(md).toContain(language);
  });

  it("renders an Experience section with every company, role, employment type, dates, and bullet", () => {
    const md = renderResumeMarkdown(resume);
    expect(md).toContain("## Experience");
    for (const experience of resume.experiences) {
      expect(md).toContain(experience.company);
      if (experience.website) expect(md).toContain(experience.website);
      for (const role of experience.roles) {
        expect(md).toContain(role.role);
        if (role.employmentType) expect(md).toContain(role.employmentType);
        expect(md).toContain(role.start);
        if (role.end) expect(md).toContain(role.end);
        for (const bullet of role.bullets) expect(md).toContain(bullet);
      }
    }
  });

  it("renders 'Present' for a null role end date", () => {
    const md = renderResumeMarkdown(resume);
    const hasOngoingRole = resume.experiences.some((exp) => exp.roles.some((role) => role.end === null));
    expect(hasOngoingRole).toBe(true);
    expect(md).toContain("Present");
  });

  it("sections appear in order: personal header, Education, Skills, Experience", () => {
    const md = renderResumeMarkdown(resume);
    const educationIndex = md.indexOf("## Education");
    const skillsIndex = md.indexOf("## Skills");
    const experienceIndex = md.indexOf("## Experience");
    expect(educationIndex).toBeGreaterThan(-1);
    expect(skillsIndex).toBeGreaterThan(educationIndex);
    expect(experienceIndex).toBeGreaterThan(skillsIndex);
  });

  it("is deterministic (same input, same output)", () => {
    expect(renderResumeMarkdown(resume)).toBe(renderResumeMarkdown(resume));
  });

  describe("exhaustive field coverage (guards silent omission)", () => {
    /**
     * Recursively collects every non-empty string value in the parsed resume,
     * skipping purely presentational fields (hex colors, logo asset paths)
     * that have no place in an LLM-facing markdown body.
     */
    function collectMeaningfulStrings(value: unknown, skipKeys: Set<string>): string[] {
      if (typeof value === "string") return value.length > 0 ? [value] : [];
      if (Array.isArray(value)) return value.flatMap((item) => collectMeaningfulStrings(item, skipKeys));
      if (value && typeof value === "object") {
        return Object.entries(value).flatMap(([key, val]) =>
          skipKeys.has(key) ? [] : collectMeaningfulStrings(val, skipKeys),
        );
      }
      return [];
    }

    it("every meaningful string field in resume.json appears in the rendered markdown", () => {
      const md = renderResumeMarkdown(resume);
      const skipKeys = new Set(["color", "logo"]);
      const strings = collectMeaningfulStrings(resume, skipKeys);
      expect(strings.length).toBeGreaterThan(20);
      for (const value of strings) {
        expect(md, `Expected rendered resume markdown to contain "${value}"`).toContain(value);
      }
    });
  });
});

describe("renderResumeMarkdown - minimal fixture", () => {
  const minimal: Resume = {
    education: [{ degree: "Deg", end: "2020", location: "Loc", school: "School", start: "2018" }],
    experiences: [
      {
        company: "Acme",
        roles: [{ bullets: ["Did a thing"], end: null, role: "Engineer", start: "2022-01" }],
      },
    ],
    personal: { email: "a@b.com", links: {}, location: "Nowhere", name: "Jane Doe", title: "Engineer" },
    skills: { programming: ["TS"], spokenLanguages: ["English"] },
  };

  it("omits optional fields cleanly (no 'undefined' or 'null' leaking into output)", () => {
    const md = renderResumeMarkdown(minimal);
    expect(md).not.toContain("undefined");
    expect(md.match(/\bnull\b/)).toBeNull();
  });

  it("renders the ongoing role as 'Present'", () => {
    const md = renderResumeMarkdown(minimal);
    expect(md).toContain("Present");
  });
});
