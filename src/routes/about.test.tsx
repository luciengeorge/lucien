import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AboutPage } from "./about";

afterEach(() => {
  cleanup();
});

describe("AboutPage", () => {
  it("names the subject in the h1 rather than just the section", () => {
    render(<AboutPage />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("About Lucien George");
  });

  it("opens with the subject's standing and background", () => {
    render(<AboutPage />);

    expect(screen.getByText(/Senior Product Engineer at Fyxer/)).toBeTruthy();
    expect(screen.getByText(/would rather own the whole problem than a slice of it/)).toBeTruthy();
  });

  it("logs every behaviour observed in the wild", () => {
    render(<AboutPage />);

    expect(screen.getByText("BEHAVIOUR IN THE WILD")).toBeTruthy();
    for (const label of ["ENDURANCE", "SNOW", "MOTORSPORT", "AT REST"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(screen.getByText(/24-hour triathlon in France, October 2026/)).toBeTruthy();
    expect(screen.getByText(/Lebanese national ski teams/)).toBeTruthy();
    expect(screen.getByText(/IAME karting championship at Le Mans/)).toBeTruthy();
    expect(screen.getByText(/Dogs, hiking, travelling/)).toBeTruthy();
  });

  it("annotates the margin with the field notes and the migration figure", () => {
    render(<AboutPage />);

    expect(screen.getByText("French, English, Arabic.")).toBeTruthy();
    expect(screen.getByText("Second eldest of four. Very family-oriented.")).toBeTruthy();
    expect(screen.getByText("Beirut. Migrated to Montreal, then London in 2018.")).toBeTruthy();
    expect(screen.getByRole("img", { name: /Migration route/ })).toBeTruthy();
  });
});
