import { WORK_ENTRIES } from "#/lib/content/registry";
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

import { CONTENT_DATES, buildSitemap } from "./sitemap[.]xml";

/** The same question the build asks git, asked again independently. */
function committedDate(file: string): string {
  return execFileSync("git", ["log", "-1", "--format=%cs", "--", `content/${file}`], { encoding: "utf-8" }).trim();
}

function entries(xml: string): { loc: string; lastmod?: string }[] {
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((match) => {
    const block = match[1] ?? "";
    return {
      loc: /<loc>(.*?)<\/loc>/.exec(block)?.[1] ?? "",
      lastmod: /<lastmod>(.*?)<\/lastmod>/.exec(block)?.[1],
    };
  });
}

describe("sitemap lastmod", () => {
  /**
   * Needs real history. CI checks out with `fetch-depth: 0` and Vercel needs
   * `VERCEL_DEEP_CLONE`, because a shallow clone cannot date a file that has not
   * changed lately.
   */
  it("has dates to work with at all", () => {
    expect(Object.keys(CONTENT_DATES).length).toBeGreaterThan(0);
  });

  it("dates each work page from its own content file, not from the deploy", () => {
    const byLoc = new Map(entries(buildSitemap()).map((entry) => [entry.loc, entry.lastmod]));

    for (const entry of WORK_ENTRIES) {
      const expected = committedDate(`${entry.slug}.md`);
      expect(expected, `no git history for content/${entry.slug}.md`).not.toBe("");
      expect(byLoc.get(`https://www.luciengeorge.com/work/${entry.slug}`)).toBe(expected);
    }
  });

  /**
   * The bug this replaced: every URL carried the build date, so each deploy told
   * Google the whole site had changed. Google discounts a `lastmod` it finds
   * inaccurate, which costs the sitemap the signal it exists to give.
   */
  it("does not give every page the same date", () => {
    const dated = entries(buildSitemap())
      .map((entry) => entry.lastmod)
      .filter((lastmod) => lastmod !== undefined);

    // Counting only real dates, so this cannot pass on a pile of omissions.
    expect(new Set(dated).size).toBeGreaterThan(2);
  });

  it("omits lastmod rather than inventing one, and never emits a malformed date", () => {
    for (const entry of entries(buildSitemap())) {
      if (entry.lastmod === undefined) continue;
      expect(entry.lastmod, entry.loc).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
