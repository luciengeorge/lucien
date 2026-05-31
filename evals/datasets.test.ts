import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function loadJsonl(file: string): Promise<unknown[]> {
  const text = await readFile(join(__dirname, "datasets", file), "utf-8");
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

interface ParsedCase {
  id?: unknown;
  category?: unknown;
  subcategory?: unknown;
  question?: unknown;
  expected_facts?: unknown;
  forbidden_patterns?: unknown;
  required_behavior?: unknown;
}

describe("eval datasets", () => {
  it("factual.jsonl parses, has at least 30 cases, each with expected_facts", async () => {
    const cases = (await loadJsonl("factual.jsonl")) as ParsedCase[];
    expect(cases.length).toBeGreaterThanOrEqual(30);
    for (const c of cases) {
      expect(typeof c.id).toBe("string");
      expect(c.category).toBe("factual");
      expect(typeof c.subcategory).toBe("string");
      expect(typeof c.question).toBe("string");
      expect(Array.isArray(c.expected_facts)).toBe(true);
      expect((c.expected_facts as unknown[]).length).toBeGreaterThan(0);
    }
  });

  it("adversarial.jsonl parses, has at least 15 cases, each with required_behavior + forbidden_patterns", async () => {
    const cases = (await loadJsonl("adversarial.jsonl")) as ParsedCase[];
    expect(cases.length).toBeGreaterThanOrEqual(15);
    for (const c of cases) {
      expect(c.category).toBe("adversarial");
      expect(typeof c.question).toBe("string");
      expect(typeof c.required_behavior).toBe("string");
      expect(Array.isArray(c.forbidden_patterns)).toBe(true);
    }
  });

  it("edge-cases.jsonl parses, has at least 10 cases, each with required_behavior", async () => {
    const cases = (await loadJsonl("edge-cases.jsonl")) as ParsedCase[];
    expect(cases.length).toBeGreaterThanOrEqual(10);
    for (const c of cases) {
      expect(c.category).toBe("edge-case");
      expect(typeof c.question).toBe("string");
      expect(typeof c.required_behavior).toBe("string");
    }
  });

  it("all case ids are globally unique", async () => {
    const all = (
      await Promise.all([loadJsonl("factual.jsonl"), loadJsonl("adversarial.jsonl"), loadJsonl("edge-cases.jsonl")])
    ).flat() as ParsedCase[];
    const ids = all.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
