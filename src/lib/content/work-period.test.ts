import { describe, expect, it } from "vitest";

import { WORK_META } from "./work-meta";
import { compressWorkPeriod, formatWorkPeriod, workPeriodStart } from "./work-period";

describe("formatWorkPeriod", () => {
  it("separates the two ends with a middot", () => {
    expect(formatWorkPeriod("Apr 2024 - Jul 2025")).toBe("Apr 2024 · Jul 2025");
  });

  it("lowercases an open-ended period", () => {
    expect(formatWorkPeriod("Sep 2025 - Present")).toBe("Sep 2025 · present");
  });

  it("handles year-only periods", () => {
    expect(formatWorkPeriod("2013 - 2019")).toBe("2013 · 2019");
  });

  it("leaves a single-part period alone", () => {
    expect(formatWorkPeriod("2019")).toBe("2019");
  });

  it("never leaves a hyphen behind for any real entry", () => {
    for (const entry of WORK_META) {
      expect(formatWorkPeriod(entry.period)).not.toContain("-");
    }
  });
});

describe("workPeriodStart", () => {
  it("returns the leading end of the period", () => {
    expect(workPeriodStart("Sep 2025 - Present")).toBe("Sep 2025");
    expect(workPeriodStart("2013 - 2019")).toBe("2013");
  });

  it("returns the whole string when there is no range", () => {
    expect(workPeriodStart("2019")).toBe("2019");
  });
});

describe("compressWorkPeriod", () => {
  it("keeps only the years so the CV date rail stays narrow", () => {
    expect(compressWorkPeriod("Jan 2022 - Sep 2023")).toBe("2022 · 2023");
  });

  it("renders an open-ended range as now", () => {
    expect(compressWorkPeriod("Sep 2025 - Present")).toBe("2025 · now");
    expect(compressWorkPeriod("Oct 2019 - Present")).toBe("2019 · now");
  });

  it("leaves an already-year range alone apart from the separator", () => {
    expect(compressWorkPeriod("2013 - 2019")).toBe("2013 · 2019");
  });

  it("returns anything it cannot parse untouched", () => {
    expect(compressWorkPeriod("Ongoing")).toBe("Ongoing");
    expect(compressWorkPeriod("2018")).toBe("2018");
  });

  it("never leaves a hyphen rule in any real work entry", () => {
    for (const entry of WORK_META) {
      expect(compressWorkPeriod(entry.period)).not.toContain(" - ");
    }
  });
});
