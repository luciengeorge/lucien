import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SkillsPage } from "./skills";

afterEach(() => {
  cleanup();
});

describe("SkillsPage", () => {
  it("names the subject in the h1 rather than just the section", () => {
    render(<SkillsPage />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("What Lucien works in");
    expect(screen.getByText("SKILLS")).toBeTruthy();
  });

  it("lists every group, most frequent first", () => {
    render(<SkillsPage />);

    for (const label of [
      "PRIMARY",
      "ALSO FLUENT",
      "CURRENT STACK",
      "ALSO SEEN IN",
      "MOBILE",
      "PUBLISHED",
      "CURRENTLY TRACKING",
    ]) {
      expect(screen.getByText(label), `missing row: ${label}`).toBeTruthy();
    }

    expect(screen.getByText("TypeScript, JavaScript, React")).toBeTruthy();
    expect(screen.getByText("Ruby on Rails, Python")).toBeTruthy();
    expect(screen.getByText(/Convex for the backend/)).toBeTruthy();
    expect(screen.getByText(/Built both native SDKs at Shopify/)).toBeTruthy();
  });

  it("links every published package to its npm page, reaching across a leader to the registry", () => {
    render(<SkillsPage />);

    for (const name of ["remix-auth-salesforce", "stimulus-lazy-loader", "stimulus-checkbox"]) {
      const link = screen.getByRole("link", { name: new RegExp(name) });
      expect(link.getAttribute("href")).toBe(`https://www.npmjs.com/package/${name}`);
    }
    expect(screen.getAllByText("NPM").length).toBe(3);
  });

  it("carries the frequency figure in the rail", () => {
    render(<SkillsPage />);

    expect(screen.getByText(/Listed by how often it shows up in the work/)).toBeTruthy();
    expect(screen.getByText("HOW OFTEN")).toBeTruthy();
    expect(screen.getByText("TypeScript")).toBeTruthy();
    expect(screen.getByText("weekly")).toBeTruthy();
  });
});
