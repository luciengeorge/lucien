import { describe, expect, it } from "vitest";

import { buildLinkWorkEntryOutput, WORK_ENTRY_SLUGS } from "./link-work-entry";

describe("WORK_ENTRY_SLUGS", () => {
  it("lists the 7 real work slugs", () => {
    expect(WORK_ENTRY_SLUGS).toEqual([
      "fyxer",
      "localista",
      "skyla",
      "shopify",
      "le-wagon",
      "impact-lebanon",
      "early-career",
    ]);
  });
});

describe("buildLinkWorkEntryOutput", () => {
  it("returns the company, role, and work page url for a known slug", () => {
    expect(buildLinkWorkEntryOutput("fyxer")).toEqual({
      company: "Fyxer",
      role: "Senior Product Engineer",
      slug: "fyxer",
      url: "/work/fyxer",
    });
  });

  it("returns a safe fallback for an unknown slug instead of throwing", () => {
    expect(() => buildLinkWorkEntryOutput("not-a-real-slug")).not.toThrow();
    const result = buildLinkWorkEntryOutput("not-a-real-slug");
    expect(result.slug).toBe("not-a-real-slug");
    expect(result.url).toBe("/work");
  });
});
