import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { FREQUENCY_BANDS, FrequencyPlot } from "./frequency-plot";

afterEach(() => {
  cleanup();
});

describe("FrequencyPlot", () => {
  it("names every tool and how often it actually comes up", () => {
    render(<FrequencyPlot />);

    for (const band of FREQUENCY_BANDS) {
      expect(screen.getByText(band.label)).toBeTruthy();
    }
    expect(screen.getAllByText("daily").length).toBe(2);
    expect(screen.getByText("weekly")).toBeTruthy();
  });

  it("reads as a list rather than a picture, so the figures are not lost to a screen reader", () => {
    const { container } = render(<FrequencyPlot />);

    expect(screen.queryByRole("img")).toBeNull();
    expect(container.querySelectorAll("ul > li").length).toBe(FREQUENCY_BANDS.length);
  });

  it("keeps the bars themselves decorative, because the cadence beside them is the fact", () => {
    const { container } = render(<FrequencyPlot />);

    const bars = container.querySelectorAll("[data-slot='frequency-bar']");
    expect(bars.length).toBe(FREQUENCY_BANDS.length);
    for (const bar of bars) {
      expect(bar.getAttribute("aria-hidden")).toBe("true");
    }
  });

  it("orders the bands most frequent first", () => {
    const shares = FREQUENCY_BANDS.map((band) => band.share);
    expect([...shares].sort((a, b) => b - a)).toEqual(shares);
  });
});
