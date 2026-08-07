import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SkillsPage } from "./skills";

afterEach(() => {
  cleanup();
});

describe("SkillsPage", () => {
  it("titles the page as an identification key", () => {
    render(<SkillsPage />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Field marks");
  });

  it("keys every field mark, most frequent first", () => {
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

  it("links every published package to its npm page", () => {
    render(<SkillsPage />);

    for (const name of ["remix-auth-salesforce", "stimulus-lazy-loader", "stimulus-checkbox"]) {
      const link = screen.getByRole("link", { name });
      expect(link.getAttribute("href")).toBe(`https://www.npmjs.com/package/${name}`);
    }
  });

  it("annotates the margin with the sighting frequency figure", () => {
    render(<SkillsPage />);

    expect(screen.getByText(/Listed by how often it shows up in the wild/)).toBeTruthy();
    expect(screen.getByText("FREQUENCY OF SIGHTING")).toBeTruthy();
    expect(screen.getByRole("img", { name: /Frequency of use/ })).toBeTruthy();
  });
});
