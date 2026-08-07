import { describe, expect, it } from "vitest";

import { WORK_META } from "./work-meta";
import { formatWorkPeriod, workPeriodStart } from "./work-period";

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
