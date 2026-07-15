import { describe, expect, it } from "vitest";

import { stripDashes } from "./strip-dashes";

describe("stripDashes", () => {
  it("replaces an em-dash surrounded by spaces with a hyphen", () => {
    expect(stripDashes("Yes — I've sent your message.")).toBe("Yes - I've sent your message.");
  });

  it("replaces an en-dash used as a range with a hyphen", () => {
    expect(stripDashes("2020–2024")).toBe("2020-2024");
  });

  it("replaces a bare em-dash with a hyphen", () => {
    expect(stripDashes("—")).toBe("-");
  });

  it("replaces a bare en-dash with a hyphen", () => {
    expect(stripDashes("–")).toBe("-");
  });

  it("collapses surrounding spaces around an em-dash", () => {
    expect(stripDashes("one  —  two")).toBe("one - two");
  });

  it("leaves text with no dashes unchanged", () => {
    expect(stripDashes("Lucien built this - it's solid.")).toBe("Lucien built this - it's solid.");
  });

  it("replaces multiple dashes in the same string", () => {
    expect(stripDashes("Fyxer — 2023–2024 — Senior Product Engineer")).toBe(
      "Fyxer - 2023-2024 - Senior Product Engineer",
    );
  });

  it("handles an empty string", () => {
    expect(stripDashes("")).toBe("");
  });
});
