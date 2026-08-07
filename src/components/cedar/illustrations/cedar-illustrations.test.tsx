import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { FrequencyPlot } from "./frequency-plot";
import { FyxerSequence } from "./fyxer-sequence";
import { MigrationRoute } from "./migration-route";

afterEach(() => {
  cleanup();
});

describe("Cedar illustrations", () => {
  it("names every stop on the migration route for screen readers", () => {
    render(<MigrationRoute />);

    expect(screen.getByRole("img", { name: /Beirut, then Montreal, then London/i })).toBeTruthy();
  });

  it("renders the migration route's three station labels", () => {
    render(<MigrationRoute />);

    expect(screen.getByText("BEY")).toBeTruthy();
    expect(screen.getByText("YUL")).toBeTruthy();
    expect(screen.getByText("LDN")).toBeTruthy();
  });

  /*
   * Only the visible route is checked: the mask's own path carries a
   * stroke-dasharray because that is how Motion implements pathLength, and
   * that one is never painted.
   */
  it("keeps the migration route solid, because Cedar dashes nothing", () => {
    const { container } = render(<MigrationRoute />);

    expect(container.querySelector("path[mask]")?.hasAttribute("stroke-dasharray")).toBe(false);
  });

  it("reveals the migration route through a travelling mask rather than a drawn stroke", () => {
    const { container } = render(<MigrationRoute />);

    const route = container.querySelector("path[mask]");
    expect(route).toBeTruthy();
    expect(container.querySelector("mask")).toBeTruthy();
  });

  it("gives the route and the arrival terracotta, and the stops along the way ink", () => {
    const { container } = render(<MigrationRoute />);

    expect(container.querySelector("path[mask]")?.getAttribute("class")).toBe("text-terracotta");

    const circles = Array.from(container.querySelectorAll("circle"));
    expect(circles.length).toBe(3);
    expect(circles.slice(0, 2).map((node) => node.getAttribute("class"))).toEqual([null, null]);
    expect(circles[2]?.getAttribute("class")).toBe("text-terracotta");
  });

  it("renders one labelled bar per tool in the frequency plot", () => {
    render(<FrequencyPlot />);

    for (const label of ["TypeScript", "React", "Convex", "Ruby on Rails", "Swift, Kotlin"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  it("states what the frequency plot actually measures in its accessible name", () => {
    render(<FrequencyPlot />);

    expect(screen.getByRole("img", { name: /Frequency of use/i })).toBeTruthy();
  });

  it("marks only the top two bars in terracotta and leaves the rest in cedar", () => {
    const { container } = render(<FrequencyPlot />);

    const bars = Array.from(container.querySelectorAll("path")).map((node) => node.getAttribute("class"));

    expect(bars).toEqual(["text-terracotta", "text-terracotta", "text-cedar", "text-cedar", "text-cedar"]);
  });

  it("describes what was shipped rather than leaving it as an unlabelled diagram", () => {
    render(<FyxerSequence />);

    expect(screen.getByRole("img", { name: /chat, then the notetaker app, then B2B and enterprise/i })).toBeTruthy();
  });

  it("renders each thing shipped, in order", () => {
    render(<FyxerSequence />);

    expect(screen.getByText("Fyxer chat")).toBeTruthy();
    expect(screen.getByText("notetaker app")).toBeTruthy();
    expect(screen.getByText("B2B and enterprise")).toBeTruthy();
  });

  it("marks the unfinished stage at a lighter weight, because Cedar dashes nothing", () => {
    const { container } = render(<FyxerSequence />);

    expect(screen.getAllByText("in progress").length).toBe(1);

    const stages = Array.from(container.querySelectorAll("rect")).map((node) => node.getAttribute("class"));
    expect(stages).toEqual([null, null, "text-ink/35"]);

    // Matching the literal pattern rather than the bare attribute, because
    // Motion writes its own stroke-dasharray while drawing an undashed rect.
    expect(container.querySelectorAll('rect[stroke-dasharray="6 4"]').length).toBe(0);
  });
});
