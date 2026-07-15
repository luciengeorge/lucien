import { describe, expect, it } from "vitest";

import { getOrCreateCorrelationId } from "./correlation-id";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe("getOrCreateCorrelationId", () => {
  it("returns the provided id when non-empty", () => {
    expect(getOrCreateCorrelationId("abc-123")).toBe("abc-123");
  });

  it("generates a uuid when given null", () => {
    expect(getOrCreateCorrelationId(null)).toMatch(UUID_PATTERN);
  });

  it("generates a uuid when given undefined", () => {
    expect(getOrCreateCorrelationId(undefined)).toMatch(UUID_PATTERN);
  });

  it("generates a uuid when given an empty string", () => {
    expect(getOrCreateCorrelationId("")).toMatch(UUID_PATTERN);
  });

  it("generates different ids across calls when none is provided", () => {
    expect(getOrCreateCorrelationId(null)).not.toBe(getOrCreateCorrelationId(null));
  });
});
