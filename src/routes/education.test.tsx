import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { EducationPage } from "./education";

afterEach(() => {
  cleanup();
});

describe("EducationPage", () => {
  it("titles the page", () => {
    render(<EducationPage />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Education");
    expect(screen.getByText("learned in")).toBeTruthy();
  });

  it("lists every institution with its qualification", () => {
    render(<EducationPage />);

    expect(screen.getByText("McGill University, Montreal")).toBeTruthy();
    expect(screen.getByText("UNSW, Sydney")).toBeTruthy();
    expect(screen.getByText("Le Wagon London, Batch 190")).toBeTruthy();
    expect(screen.getByText("Harvard Business School, Boston")).toBeTruthy();

    expect(screen.getByText("BENG, SOFTWARE ENGINEERING")).toBeTruthy();
    expect(screen.getByText("EXCHANGE SEMESTER")).toBeTruthy();
    expect(screen.getByText("FULLSTACK BOOTCAMP, 9 WEEKS")).toBeTruthy();
    expect(screen.getByText("FAMILIES IN BUSINESS, ONE WEEK")).toBeTruthy();
  });

  it("runs the spine forwards in time", () => {
    render(<EducationPage />);

    const years = screen.getAllByText(/^\d{4}( · \d{4})?$/).map((node) => node.textContent);

    expect(years).toEqual(["2013 · 2018", "2016", "2018", "2022"]);
  });

  it("carries the notes that did not fit the spine", () => {
    render(<EducationPage />);

    expect(screen.getByText(/nearly stopped altogether/)).toBeTruthy();
    expect(screen.getByText(/Two internships at Dataflow in Beirut/)).toBeTruthy();
  });
});
