import { describe, expect, it } from "vitest";

import { formatArticleDate } from "./article-date";

describe("formatArticleDate", () => {
  it("formats an ISO date as a readable day", () => {
    expect(formatArticleDate("2026-08-13")).toBe("13 August 2026");
  });

  /*
   * An ISO date is UTC midnight. Formatting it in a negative-offset timezone
   * without pinning to UTC renders the previous day, so a piece published on
   * the 1st reads as the last day of the previous month for readers in the US.
   */
  it("does not shift the day for viewers behind UTC", () => {
    const original = process.env.TZ;
    process.env.TZ = "America/Los_Angeles";
    try {
      expect(formatArticleDate("2026-08-01")).toBe("1 August 2026");
    } finally {
      process.env.TZ = original;
    }
  });

  it("returns the input unchanged when it is not an ISO date", () => {
    expect(formatArticleDate("not a date")).toBe("not a date");
  });
});
