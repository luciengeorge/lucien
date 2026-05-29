import { describe, expect, it } from "vitest";

import { WORK_ENTRIES } from "./registry";
import { WORK_META } from "./work-meta";

/**
 * Guards parity between WORK_META (consumed by the Playwright e2e spec) and
 * WORK_ENTRIES (consumed by the routes). They are constructed from the same
 * source list — these assertions exist so any future drift (e.g. someone
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
});
