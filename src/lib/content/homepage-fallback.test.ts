import { HOMEPAGE_FALLBACK_HTML } from "#/lib/content/homepage-fallback";
import { WORK_META } from "#/lib/content/work-meta";
import { WRITING_META } from "#/lib/content/writing-meta";
import { describe, expect, it } from "vitest";

function text(): string {
  return HOMEPAGE_FALLBACK_HTML.replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

describe("homepage static summary (the disclosure under the intro)", () => {
  it("carries enough prose to stand in for the chat", () => {
    expect(text().length).toBeGreaterThan(1500);
  });

  it("never introduces a second h1, since the identity block owns the only one", () => {
    expect(HOMEPAGE_FALLBACK_HTML).not.toContain("<h1");
  });

  /*
   * The homepage scored "H1 but flat heading structure" with one h2 on the
   * page. Its outline comes from here, so this is what has to carry it.
   */
  it("carries a real outline, not a single heading", () => {
    expect((HOMEPAGE_FALLBACK_HTML.match(/<h2/g) ?? []).length).toBeGreaterThanOrEqual(4);
  });

  it("answers who and where without a second request", () => {
    const body = text();
    for (const fact of ["Lucien George", "Senior Product Engineer", "Fyxer", "London", "Beirut"]) {
      expect(body).toContain(fact);
    }
  });

  it("lists every role with its period, straight from the work metadata", () => {
    const body = text();
    for (const entry of WORK_META) {
      expect(body).toContain(entry.company);
      expect(body).toContain(entry.period);
    }
  });

  it("lists every article", () => {
    const body = text();
    for (const entry of WRITING_META) {
      expect(body).toContain(entry.title);
    }
  });

  it("routes a reader into the rest of the site", () => {
    for (const path of ["/about", "/work", "/writing", "/skills", "/education", "/resume", "/contact"]) {
      expect(HOMEPAGE_FALLBACK_HTML).toContain(`href="${path}"`);
    }
  });

  it("points a crawler at the markdown surface rather than leaving it in a dead chat", () => {
    for (const path of ["/index.md", "/llms.txt", "/llms-full.txt", "/agents.md"]) {
      expect(HOMEPAGE_FALLBACK_HTML).toContain(`href="${path}"`);
    }
  });

  it("states the spelling, which is the question the FAQ exists for", () => {
    expect(text()).toContain("no s");
  });
});
