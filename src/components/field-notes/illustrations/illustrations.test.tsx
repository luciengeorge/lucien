import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { FrequencyPlot } from "./frequency-plot";
import { MigrationRoute } from "./migration-route";
import { MountainSketch } from "./mountain-sketch";
import { RecordingFlow } from "./recording-flow";
import { Sparkline } from "./sparkline";

afterEach(() => {
  cleanup();
});

describe("Field Notes illustrations", () => {
  it("gives the mountain sketch an accessible name", () => {
    render(<MountainSketch />);

    expect(screen.getByRole("img", { name: /mountain profile/i })).toBeTruthy();
  });

  it("gives the sparkline an accessible name", () => {
    render(<Sparkline />);

    expect(screen.getByRole("img", { name: /circled peak/i })).toBeTruthy();
  });

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

  it("describes the recording flow rather than leaving it as an unlabelled diagram", () => {
    render(<RecordingFlow />);

    expect(screen.getByRole("img", { name: /meeting feeds the desktop app/i })).toBeTruthy();
  });

  it("renders each stage of the recording flow", () => {
    render(<RecordingFlow />);

    expect(screen.getByText("the meeting")).toBeTruthy();
    expect(screen.getByText("desktop app")).toBeTruthy();
    expect(screen.getByText("meeting chat")).toBeTruthy();
  });

  it("keeps the desktop-app outline on its own dash pattern", () => {
    const { container } = render(<RecordingFlow />);

    const dashed = container.querySelectorAll('rect[stroke-dasharray="6 4"]');
    expect(dashed.length).toBe(1);
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
});
