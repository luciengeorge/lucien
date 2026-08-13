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

  /*
   * A tight em-dash between words is a parenthetical, not a range, and the
   * one-for-one swap welded the words together. This shipped to production:
   * the homepage intro read "his own ventures-including Impact Lebanon,
   * Skyla, and Localista-Lucien focuses on...", where "Localista-Lucien"
   * parses as a compound surname.
   */
  it("spaces a tight dash between words, so it cannot weld them together", () => {
    expect(stripDashes("his own ventures—including Impact Lebanon")).toBe(
      "his own ventures - including Impact Lebanon",
    );
    expect(stripDashes("Localista—Lucien focuses")).toBe("Localista - Lucien focuses");
  });

  it("still keeps a numeric range tight, because there the hyphen is correct", () => {
    expect(stripDashes("2020–2024")).toBe("2020-2024");
    expect(stripDashes("Fyxer 2023–2024 report")).toBe("Fyxer 2023-2024 report");
  });

  it("spaces a dash that joins a word to a number, which is never a range", () => {
    expect(stripDashes("shipped—2024 was the year")).toBe("shipped - 2024 was the year");
  });

  it("never produces a hyphen with a word character on both sides", () => {
    const samples = [
      "his own ventures—including Impact Lebanon, Skyla, and Localista—Lucien focuses",
      "one—two—three",
      "Yes — I've sent your message.",
      "2020–2024",
    ];
    for (const sample of samples) {
      const result = stripDashes(sample);
      // A range is the one legitimate weld, so allow digit-digit only.
      expect(result, `welded in: ${result}`).not.toMatch(/[A-Za-z]-[A-Za-z0-9]|[A-Za-z0-9]-[A-Za-z]/);
    }
  });
});
