import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import type { EvalCase } from "./types";

import { EvalCaseSchema } from "./types";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function loadCases(file: string): Promise<EvalCase[]> {
  const text = await readFile(join(__dirname, "datasets", file), "utf-8");
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => EvalCaseSchema.parse(JSON.parse(line)));
}

describe("eval datasets", () => {
  it("factual.jsonl parses, has at least 30 cases, each with expected_facts", async () => {
    const cases = await loadCases("factual.jsonl");
    expect(cases.length).toBeGreaterThanOrEqual(30);
    for (const c of cases) {
      expect(c.category).toBe("factual");
      expect(c.expected_facts?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("adversarial.jsonl parses, has at least 15 cases, each with required_behavior + forbidden_patterns", async () => {
    const cases = await loadCases("adversarial.jsonl");
    expect(cases.length).toBeGreaterThanOrEqual(15);
    for (const c of cases) {
      expect(c.category).toBe("adversarial");
      expect(typeof c.required_behavior).toBe("string");
      expect(Array.isArray(c.forbidden_patterns)).toBe(true);
    }
  });

  it("edge-cases.jsonl parses, has at least 10 cases, each with required_behavior", async () => {
    const cases = await loadCases("edge-cases.jsonl");
    expect(cases.length).toBeGreaterThanOrEqual(10);
    for (const c of cases) {
      expect(c.category).toBe("edge-case");
      expect(typeof c.required_behavior).toBe("string");
    }
  });

  it("all case ids are globally unique", async () => {
    const all = (
      await Promise.all([loadCases("factual.jsonl"), loadCases("adversarial.jsonl"), loadCases("edge-cases.jsonl")])
    ).flat();
    const ids = all.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
