import { describe, expect, it } from "vitest";

import { buildWorkEntryMeta, buildWritingEntryMeta } from "./page-meta";

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
