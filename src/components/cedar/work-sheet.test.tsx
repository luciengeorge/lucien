import type { WorkEntry } from "#/lib/content/registry";

import { findWorkEntry } from "#/lib/content/registry";
import { renderInRouter } from "#/test/render-in-router";
import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { WorkSheet } from "./work-sheet";

afterEach(() => {
  cleanup();
});

function entryFor(slug: string): WorkEntry {
  const entry = findWorkEntry(slug);
  if (!entry) throw new Error(`No work entry for "${slug}"`);
  return entry;
}

describe("WorkSheet", () => {
  it("heads the page with the span of the work and the company", async () => {
    await renderInRouter(<WorkSheet entry={entryFor("fyxer")} />);

    expect(screen.getByRole("heading", { level: 1, name: "Fyxer" })).toBeTruthy();
    expect(screen.getByText("since 2025")).toBeTruthy();
    // Once under the title, once in the aside: the header states it, the aside files it.
    expect(screen.getAllByText("Senior Product Engineer").length).toBe(2);
  });

  it("dates a finished run by its two ends", async () => {
    await renderInRouter(<WorkSheet entry={entryFor("shopify")} />);

    expect(screen.getByText("2022 to 2023")).toBeTruthy();
  });

  it("leaves the journal conceit behind", async () => {
    await renderInRouter(<WorkSheet entry={entryFor("fyxer")} />);

    expect(screen.queryByText(/specimen/i)).toBeNull();
    expect(screen.queryByText(/collected/i)).toBeNull();
  });

  it("annotates the aside with the role and the period", async () => {
    await renderInRouter(<WorkSheet entry={entryFor("shopify")} />);

    expect(screen.getByText("ROLE")).toBeTruthy();
    expect(screen.getByText("PERIOD")).toBeTruthy();
    expect(screen.getByText("Jan 2022 · Sep 2023")).toBeTruthy();
  });

  it("shows the company logo and the CV download", async () => {
    await renderInRouter(<WorkSheet entry={entryFor("fyxer")} />);

    expect(screen.getByRole("img", { name: /^Fyxer( logo)?$/i })).toBeTruthy();
    const cv = screen.getByRole("link", { name: /download cv/i });
    expect(cv.getAttribute("href")).toBe("/api/resume/pdf");
  });

  it("links back to the index", async () => {
    await renderInRouter(<WorkSheet entry={entryFor("shopify")} />);

    const back = screen.getByRole("link", { name: /back to work/i });
    expect(back.getAttribute("href")).toBe("/work");
  });

  it("renders the markdown body", async () => {
    await renderInRouter(<WorkSheet entry={entryFor("shopify")} />);

    expect(screen.getByText(/first as a Developer and then promoted to Senior Developer/)).toBeTruthy();
  });

  it("sets the body in the sans, not in Fraunces", async () => {
    const { container } = await renderInRouter(<WorkSheet entry={entryFor("shopify")} />);

    const prose = container.querySelector("[data-slot='work-prose']");
    expect(prose?.className).toContain("font-sans");
    expect(prose?.className).not.toContain("font-display");
  });

  it("draws the figure on the entry that has one", async () => {
    await renderInRouter(<WorkSheet entry={entryFor("fyxer")} />);

    expect(screen.getByRole("heading", { name: "WHAT HE SHIPPED, IN ORDER" })).toBeTruthy();
    expect(screen.getByRole("img", { name: /chat, then the notetaker app/i })).toBeTruthy();
  });

  it("leaves entries without a figure unillustrated", async () => {
    await renderInRouter(<WorkSheet entry={entryFor("shopify")} />);

    expect(screen.queryByRole("heading", { name: /WHAT HE SHIPPED/i })).toBeNull();
    expect(screen.queryByRole("img", { name: /chat, then the notetaker app/i })).toBeNull();
  });

  it("shows the stats only for the entry that has them", async () => {
    await renderInRouter(<WorkSheet entry={entryFor("fyxer")} />);
    expect(screen.getByText("REACH")).toBeTruthy();
    expect(screen.getByText("1,000 weekly active users")).toBeTruthy();
    expect(screen.getByText("THE TEAM")).toBeTruthy();

    cleanup();

    await renderInRouter(<WorkSheet entry={entryFor("shopify")} />);
    expect(screen.queryByText("REACH")).toBeNull();
  });
});
