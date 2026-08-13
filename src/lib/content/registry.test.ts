import { describe, expect, it } from "vitest";

import { WORK_ENTRIES, WRITING_ENTRIES, findWritingEntry } from "./registry";
import { WORK_META } from "./work-meta";
import { WRITING_META } from "./writing-meta";

/**
 * Guards parity between WORK_META (consumed by the Playwright e2e spec) and
 * WORK_ENTRIES (consumed by the routes). They are constructed from the same
 * source list - these assertions exist so any future drift (e.g. someone
 * inlines the array back into registry.ts, or forgets to add a markdown
 * source for a new slug) fails CI before reaching production.
 */
describe("work registry / work-meta parity", () => {
  it("WORK_ENTRIES has exactly one row per WORK_META entry, in the same order", () => {
    expect(WORK_ENTRIES).toHaveLength(WORK_META.length);
    for (const [index, meta] of WORK_META.entries()) {
      const entry = WORK_ENTRIES[index];
      expect(entry, `WORK_ENTRIES[${index}] is missing`).toBeDefined();
      expect(entry?.slug).toBe(meta.slug);
      expect(entry?.company).toBe(meta.company);
      expect(entry?.role).toBe(meta.role);
      expect(entry?.period).toBe(meta.period);
      expect(entry?.summary).toBe(meta.summary);
      expect(entry?.logo).toBe(meta.logo);
      expect(entry?.color).toBe(meta.color);
    }
  });

  it("every WORK_ENTRIES row has a non-empty markdown source", () => {
    for (const entry of WORK_ENTRIES) {
      expect(entry.source, `Source for "${entry.slug}" is empty`).toBeTruthy();
      expect(entry.source.trim().length).toBeGreaterThan(20);
    }
  });

  it("WORK_META slugs are unique", () => {
    const slugs = WORK_META.map((m) => m.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("WORK_META slugs are kebab-case", () => {
    for (const { slug } of WORK_META) {
      expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it("each WORK_META entry has a brand color and a logo path (or explicit null)", () => {
    for (const meta of WORK_META) {
      expect(meta.color, `color for "${meta.slug}"`).toMatch(/^#[0-9a-fA-F]{6}$/);
      // logo is either null or a /companies/*.png path
      if (meta.logo !== null) {
        expect(meta.logo, `logo for "${meta.slug}"`).toMatch(/^\/companies\/.+\.(png|svg|webp)$/);
      }
    }
  });
});

describe("writing registry / writing-meta parity", () => {
  it("WRITING_ENTRIES has exactly one row per WRITING_META entry, in the same order", () => {
    expect(WRITING_ENTRIES).toHaveLength(WRITING_META.length);
    for (const [index, meta] of WRITING_META.entries()) {
      const entry = WRITING_ENTRIES[index];
      expect(entry, `WRITING_ENTRIES[${index}] is missing`).toBeDefined();
      expect(entry?.slug).toBe(meta.slug);
      expect(entry?.title).toBe(meta.title);
      expect(entry?.description).toBe(meta.description);
      expect(entry?.published).toBe(meta.published);
      expect(entry?.summary).toBe(meta.summary);
    }
  });

  it("every article has a substantial markdown body", () => {
    for (const entry of WRITING_ENTRIES) {
      expect(entry.source, `Source for "${entry.slug}" is empty`).toBeTruthy();
      expect(entry.source.trim().length, `Source for "${entry.slug}" is too short to publish`).toBeGreaterThan(500);
    }
  });

  it("slugs are unique and kebab-case", () => {
    const slugs = WRITING_META.map((m) => m.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it("dates are ISO YYYY-MM-DD, and updated is never before published", () => {
    for (const meta of WRITING_META) {
      expect(meta.published, `published for "${meta.slug}"`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (meta.updated !== undefined) {
        expect(meta.updated, `updated for "${meta.slug}"`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(meta.updated >= meta.published, `updated precedes published for "${meta.slug}"`).toBe(true);
      }
    }
  });

  it("findWritingEntry resolves a known slug and returns undefined otherwise", () => {
    const first = WRITING_META[0];
    expect(first).toBeDefined();
    if (first) expect(findWritingEntry(first.slug)?.slug).toBe(first.slug);
    expect(findWritingEntry("no-such-article")).toBeUndefined();
  });
});
