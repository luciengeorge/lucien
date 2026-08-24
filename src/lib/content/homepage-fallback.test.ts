import { HOMEPAGE_FALLBACK_HTML } from "#/lib/content/homepage-fallback";
import { WORK_META } from "#/lib/content/work-meta";
import { WRITING_META } from "#/lib/content/writing-meta";
import { describe, expect, it } from "vitest";

function text(): string {
  return HOMEPAGE_FALLBACK_HTML.replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

describe("homepage no-JavaScript fallback", () => {
  it("carries enough prose to stand in for the chat", () => {
    expect(text().length).toBeGreaterThan(1500);
  });

  it("never introduces a second h1, since the visible identity block owns the only one", () => {
    expect(HOMEPAGE_FALLBACK_HTML).not.toContain("<h1");
    expect(HOMEPAGE_FALLBACK_HTML).toContain("<h2");
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
    for (const path of ["/index.md", "/llms.txt", "/llms-full.txt", "/agents.md", "/developers"]) {
      expect(HOMEPAGE_FALLBACK_HTML).toContain(`href="${path}"`);
    }
  });

  it("states the spelling, which is the question the FAQ exists for", () => {
    expect(text()).toContain("no s");
  });
});
