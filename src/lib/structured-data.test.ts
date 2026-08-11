import { CANONICAL_NAME, NAME_MISSPELLINGS } from "#/lib/name-misspellings";
import { structuredData } from "#/lib/structured-data";
import { describe, expect, it } from "vitest";

interface PersonNode {
  "@type": string;
  name: string;
  alternateName?: string[];
}

function isPersonNode(value: unknown): value is PersonNode {
  return typeof value === "object" && value !== null && "@type" in value && value["@type"] === "Person";
}

function personNode(): PersonNode {
  const node = structuredData["@graph"].find((entry) => isPersonNode(entry));
  if (!isPersonNode(node)) {
    throw new Error("No Person node in the structured data graph");
  }
  return node;
}

describe("Person structured data", () => {
  it("carries the canonical spelling as the name", () => {
    expect(personNode().name).toBe(CANONICAL_NAME);
  });

  /*
   * A misspelling is not an alias. alternateName asserts the person is also
   * known by that name, and "Lucien Georges" takes an s the name does not.
   * The search coverage for these queries comes from prose that names the
   * correct spelling, never from claiming the wrong one as a name.
   */
  it("never claims a misspelling as an alternateName", () => {
    const { alternateName } = personNode();
    for (const misspelling of NAME_MISSPELLINGS) {
      expect(alternateName ?? []).not.toContain(misspelling);
    }
  });

  it("answers the spelling question in the FAQ, where the correct spelling is stated", () => {
    const serialized = JSON.stringify(structuredData);
    expect(serialized).toContain("no s");
    for (const misspelling of NAME_MISSPELLINGS) {
      expect(serialized).toContain(misspelling);
    }
  });
});
