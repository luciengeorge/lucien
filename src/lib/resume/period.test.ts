import { describe, expect, it } from "vitest";

import { compressPeriod } from "./period";

describe("compressPeriod", () => {
  it("keeps only the years of a month-qualified range", () => {
    expect(compressPeriod("Jan 2022 - Sep 2023")).toBe("2022 · 2023");
  });

  it("reads an open-ended range as still running", () => {
    expect(compressPeriod("Sep 2025 - Present")).toBe("2025 · now");
    expect(compressPeriod("Oct 2019 - Present")).toBe("2019 · now");
  });

  it("leaves an already bare year range alone apart from the separator", () => {
    expect(compressPeriod("2013 - 2019")).toBe("2013 · 2019");
  });

  it("returns the original string when there is nothing to compress", () => {
    expect(compressPeriod("Ongoing")).toBe("Ongoing");
    expect(compressPeriod("2018")).toBe("2018");
  });
});
