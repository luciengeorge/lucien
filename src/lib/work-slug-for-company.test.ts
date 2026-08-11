import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { WORK_META } from "./content/work-meta";
import { workSlugForCompany } from "./work-slug-for-company";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function resumeCompanies(): Promise<string[]> {
  const raw = await readFile(join(__dirname, "..", "..", "content", "resume.json"), "utf-8");
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== "object" || parsed === null || !("experiences" in parsed)) {
    throw new Error("resume.json has no experiences array");
  }
  const { experiences } = parsed;
  if (!Array.isArray(experiences)) throw new Error("experiences is not an array");
  return experiences.map((entry: { company?: unknown }) => (typeof entry.company === "string" ? entry.company : ""));
}

describe("workSlugForCompany", () => {
  it("resolves a company that matches a work entry by name", () => {
    expect(workSlugForCompany("Fyxer")).toBe("fyxer");
    expect(workSlugForCompany("Le Wagon")).toBe("le-wagon");
  });

  it("ignores case and surrounding whitespace", () => {
    expect(workSlugForCompany("  fyxer ")).toBe("fyxer");
    expect(workSlugForCompany("IMPACT LEBANON")).toBe("impact-lebanon");
  });

  it("resolves a declared resume alias, for entries the resume names differently", () => {
    expect(workSlugForCompany("Hoxton Digital")).toBe("early-career");
  });

  it("returns undefined for a company with no work entry", () => {
    expect(workSlugForCompany("Acme")).toBeUndefined();
    expect(workSlugForCompany("")).toBeUndefined();
  });

  it("resolves every company in resume.json, so no work entry is left orphaned", async () => {
    const companies = await resumeCompanies();
    expect(companies.length).toBeGreaterThan(0);
    for (const company of companies) {
      expect(workSlugForCompany(company), `no work entry for resume company "${company}"`).toBeDefined();
    }
  });

  it("covers every work entry from the resume, in both directions", async () => {
    const companies = await resumeCompanies();
    const reached = new Set(companies.map((company) => workSlugForCompany(company)));
    for (const entry of WORK_META) {
      expect(reached.has(entry.slug), `work entry "${entry.slug}" is not linked from any resume row`).toBe(true);
    }
  });
});
