import type { WorkEntry } from "#/lib/content/registry";

import { findWorkEntry } from "#/lib/content/registry";
import { WORK_META } from "#/lib/content/work-meta";
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
  it("heads the sheet with the company, its specimen number and its collection date", async () => {
    await renderInRouter(<WorkSheet entry={entryFor("fyxer")} />);

    expect(screen.getByRole("heading", { level: 1, name: "Fyxer" })).toBeTruthy();
    const total = String(WORK_META.length).padStart(2, "0");
    expect(screen.getByText(`specimen 01 of ${total} · collected Sep 2025`)).toBeTruthy();
  });

  it("annotates the margin with the role and the period", async () => {
    await renderInRouter(<WorkSheet entry={entryFor("shopify")} />);

    expect(screen.getByText("ROLE")).toBeTruthy();
    expect(screen.getByText("Senior Developer")).toBeTruthy();
    expect(screen.getByText("PERIOD")).toBeTruthy();
    expect(screen.getByText("Jan 2022 · Sep 2023")).toBeTruthy();
    expect(screen.getByText("Ask the page anything about this one.")).toBeTruthy();
  });

  it("shows the company logo and the CV download", async () => {
    await renderInRouter(<WorkSheet entry={entryFor("fyxer")} />);

    expect(screen.getByRole("img", { name: /^Fyxer( logo)?$/i })).toBeTruthy();
    const cv = screen.getByRole("link", { name: /download cv/i });
    expect(cv.getAttribute("href")).toBe("/api/resume/pdf");
  });

  it("links back to the register", async () => {
    await renderInRouter(<WorkSheet entry={entryFor("shopify")} />);

    const back = screen.getByRole("link", { name: /back to work/i });
    expect(back.getAttribute("href")).toBe("/work");
  });

  it("renders the markdown body", async () => {
    await renderInRouter(<WorkSheet entry={entryFor("shopify")} />);

    expect(screen.getByText(/first as a Developer and then promoted to Senior Developer/)).toBeTruthy();
  });

  it("draws the figure on the entry that has one", async () => {
    await renderInRouter(<WorkSheet entry={entryFor("fyxer")} />);

    expect(screen.getByRole("heading", { name: "FIG. 1 · WHAT HE SHIPPED, IN ORDER" })).toBeTruthy();
    expect(screen.getByRole("img", { name: /chat, then the notetaker app/i })).toBeTruthy();
  });

  it("leaves entries without a figure unillustrated", async () => {
    await renderInRouter(<WorkSheet entry={entryFor("shopify")} />);

    expect(screen.queryByRole("heading", { name: /^FIG\./ })).toBeNull();
    expect(screen.queryByRole("img", { name: /^Diagram:/ })).toBeNull();
  });

  it("shows the field stats only for the entry that has them", async () => {
    await renderInRouter(<WorkSheet entry={entryFor("fyxer")} />);
    expect(screen.getByText("POPULATION")).toBeTruthy();
    expect(screen.getByText("1,000 weekly active users")).toBeTruthy();
    expect(screen.getByText("OBSERVERS")).toBeTruthy();

    cleanup();

    await renderInRouter(<WorkSheet entry={entryFor("shopify")} />);
    expect(screen.queryByText("POPULATION")).toBeNull();
  });
});
