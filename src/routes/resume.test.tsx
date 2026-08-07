import { WORK_META } from "#/lib/content/work-meta";
import { loadResume } from "#/lib/resume/load";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ResumeView } from "./resume";

afterEach(() => {
  cleanup();
});

function renderResume() {
  render(<ResumeView resume={loadResume()} />);
}

describe("ResumeView", () => {
  it("makes the person the h1, with the document type beneath it", () => {
    renderResume();

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Lucien George");
    expect(screen.getByText("Curriculum vitae")).toBeTruthy();
  });

  it("keeps the PDF download pointing at the generated resume", () => {
    renderResume();

    const link = screen.getByRole("link", { name: /DOWNLOAD PDF/ });
    expect(link.getAttribute("href")).toBe("/api/resume/pdf");
  });

  it("lists every company from the work record", () => {
    renderResume();

    for (const entry of WORK_META) {
      expect(screen.getByText(entry.company), `missing company: ${entry.company}`).toBeTruthy();
    }
  });

  it("compresses each date range into the year rail", () => {
    renderResume();

    expect(screen.getByText("2025 · now")).toBeTruthy();
    expect(screen.getByText("2022 · 2023")).toBeTruthy();
    expect(screen.getByText("2013 · 2019")).toBeTruthy();
  });

  it("prints the short sections a reader skims for", () => {
    renderResume();

    for (const label of ["PROFILE", "EXPERIENCE", "EDUCATION", "LANGUAGES"]) {
      expect(screen.getByText(label), `missing section: ${label}`).toBeTruthy();
    }
    expect(screen.getByText("French, English, Arabic.")).toBeTruthy();
    expect(screen.getByText(/McGill University/)).toBeTruthy();
  });

  it("offers the machine-readable copies in the margin", () => {
    renderResume();

    expect(screen.getByRole("link", { name: "/resume.md" }).getAttribute("href")).toBe("/resume.md");
    expect(screen.getByRole("link", { name: "/llms-full.txt" }).getAttribute("href")).toBe("/llms-full.txt");
    expect(screen.getByText(/Or just ask the page/)).toBeTruthy();
  });
});
