import { describe, expect, it } from "vitest";

import type { PageMeta } from "./page-meta";

import {
  ABOUT_META,
  CONTACT_META,
  EDUCATION_META,
  HOME_META,
  PRIVACY_META,
  RESUME_META,
  SEO_DESCRIPTION_MAX_LENGTH,
  SEO_TITLE_MAX_LENGTH,
  SKILLS_META,
  WORK_INDEX_META,
  WRITING_INDEX_META,
  buildWorkEntryMeta,
  buildWritingEntryMeta,
} from "./page-meta";
import { WORK_META } from "./work-meta";
import { WRITING_META } from "./writing-meta";

describe("buildWorkEntryMeta", () => {
  it("builds the title as '<role> at <company> | Lucien George' and the description as the entry summary", () => {
    const meta = buildWorkEntryMeta({
      company: "Fyxer",
      role: "Senior Product Engineer",
      summary: "Leads the notetaker app.",
    });
    expect(meta).toEqual({
      title: "Senior Product Engineer at Fyxer | Lucien George",
      description: "Leads the notetaker app.",
    });
  });
});

describe("buildWritingEntryMeta", () => {
  it("uses the SEO title, not the headline, when the article has one", () => {
    const meta = buildWritingEntryMeta({
      title: "A long headline that would run past sixty characters in a search result",
      seoTitle: "Short title",
      description: "What it covers.",
    });
    expect(meta).toEqual({ title: "Short title | Lucien George", description: "What it covers." });
  });

  it("falls back to '<headline> | Lucien George' without one", () => {
    const meta = buildWritingEntryMeta({ title: "Headline", description: "What it covers." });
    expect(meta.title).toBe("Headline | Lucien George");
  });
});

const PAGES: Array<[string, PageMeta]> = [
  ["/", HOME_META],
  ["/about", ABOUT_META],
  ["/contact", CONTACT_META],
  ["/privacy", PRIVACY_META],
  ["/skills", SKILLS_META],
  ["/education", EDUCATION_META],
  ["/work", WORK_INDEX_META],
  ["/resume", RESUME_META],
  ["/writing", WRITING_INDEX_META],
  ...WORK_META.map((entry): [string, PageMeta] => [`/work/${entry.slug}`, buildWorkEntryMeta(entry)]),
  ...WRITING_META.map((entry): [string, PageMeta] => [`/writing/${entry.slug}`, buildWritingEntryMeta(entry)]),
];

describe("page titles and descriptions", () => {
  it.each(PAGES)("%s fits a search result", (_path, meta) => {
    expect(meta.title.length, meta.title).toBeLessThanOrEqual(SEO_TITLE_MAX_LENGTH);
    expect(meta.description.length, meta.description).toBeLessThanOrEqual(SEO_DESCRIPTION_MAX_LENGTH);
  });

  it("are unique across pages", () => {
    const titles = PAGES.map(([, meta]) => meta.title);
    const descriptions = PAGES.map(([, meta]) => meta.description);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });

  it("name him on the homepage, with his role and employer", () => {
    expect(HOME_META.title).toContain("Lucien George");
    for (const fact of ["Lucien George", "Fyxer", "Shopify"]) {
      expect(HOME_META.description).toContain(fact);
    }
  });
});
