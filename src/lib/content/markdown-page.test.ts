import { SITE_URL } from "#/lib/site-config";
import { describe, expect, it } from "vitest";

import { buildMarkdownPage } from "./markdown-page";

describe("buildMarkdownPage", () => {
  it("emits frontmatter (title, description, url) followed by an H1 and the body", () => {
    const page = buildMarkdownPage({
      title: "About Lucien George",
      description: "Bio and background.",
      path: "/about",
      body: "Hello there.",
    });

    expect(page).toBe(
      [
        "---",
        "title: About Lucien George",
        "description: Bio and background.",
        `url: ${SITE_URL}/about`,
        "---",
        "",
        "# About Lucien George",
        "",
        "Hello there.",
        "",
      ].join("\n"),
    );
  });

  it("resolves the url from SITE_URL + path", () => {
    const page = buildMarkdownPage({ title: "T", description: "D", path: "/skills", body: "B" });
    expect(page).toContain(`url: ${SITE_URL}/skills`);
  });

  it("appends extraFrontmatter keys after url, in the given order", () => {
    const page = buildMarkdownPage({
      title: "Fyxer - Senior Product Engineer",
      description: "D",
      path: "/work/fyxer",
      body: "B",
      extraFrontmatter: { company: "Fyxer", role: "Senior Product Engineer", period: "2024 - present" },
    });

    const frontmatter = page.split("---")[1];
    expect(frontmatter?.trim().split("\n")).toEqual([
      "title: Fyxer - Senior Product Engineer",
      "description: D",
      `url: ${SITE_URL}/work/fyxer`,
      "company: Fyxer",
      "role: Senior Product Engineer",
      "period: 2024 - present",
    ]);
  });

  it("passes the body through verbatim (trimmed)", () => {
    const page = buildMarkdownPage({ title: "T", description: "D", path: "/x", body: "  line one\nline two  \n" });
    expect(page).toContain("line one\nline two");
  });

  describe("YAML-safety of frontmatter values", () => {
    it("quotes a title containing a colon", () => {
      const page = buildMarkdownPage({ title: "Fyxer: Senior Engineer", description: "D", path: "/x", body: "B" });
      expect(page).toContain('title: "Fyxer: Senior Engineer"');
    });

    it("quotes a description containing a double quote, escaping it", () => {
      const page = buildMarkdownPage({ title: "T", description: 'He said "hi"', path: "/x", body: "B" });
      expect(page).toContain('description: "He said \\"hi\\""');
    });

    it("quotes a value containing a hash (comment marker)", () => {
      const page = buildMarkdownPage({ title: "T", description: "Uses C#", path: "/x", body: "B" });
      expect(page).toContain('description: "Uses C#"');
    });

    it("quotes a value containing a newline, escaping it to \\n", () => {
      const page = buildMarkdownPage({ title: "T", description: "Line one\nLine two", path: "/x", body: "B" });
      expect(page).toContain('description: "Line one\\nLine two"');
    });

    it("leaves plain values unquoted", () => {
      const page = buildMarkdownPage({
        title: "Plain Title",
        description: "Plain description.",
        path: "/x",
        body: "B",
      });
      expect(page).toContain("title: Plain Title");
      expect(page).toContain("description: Plain description.");
    });

    it("quotes extraFrontmatter values needing escaping the same way", () => {
      const page = buildMarkdownPage({
        title: "T",
        description: "D",
        path: "/x",
        body: "B",
        extraFrontmatter: { period: "2024: present" },
      });
      expect(page).toContain('period: "2024: present"');
    });
  });
});
