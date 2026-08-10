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
  it("heads the page with the company and reaches across to the dates", async () => {
    await renderInRouter(<WorkSheet entry={entryFor("fyxer")} />);

    expect(screen.getByRole("heading", { level: 1, name: "Fyxer" })).toBeTruthy();
    expect(screen.getByText("Senior Product Engineer")).toBeTruthy();
    expect(screen.getByText("Sep 2025 · present")).toBeTruthy();
  });

  it("dates a finished run by its two ends", async () => {
    await renderInRouter(<WorkSheet entry={entryFor("shopify")} />);

    expect(screen.getByText("Jan 2022 · Sep 2023")).toBeTruthy();
  });

  it("states the role once, not once per column", async () => {
    await renderInRouter(<WorkSheet entry={entryFor("fyxer")} />);

    expect(screen.getAllByText("Senior Product Engineer").length).toBe(1);
  });

  it("leaves the journal conceit behind", async () => {
    await renderInRouter(<WorkSheet entry={entryFor("fyxer")} />);

    expect(screen.queryByText(/specimen/i)).toBeNull();
    expect(screen.queryByText(/collected/i)).toBeNull();
  });

  it("shows the company logo", async () => {
    await renderInRouter(<WorkSheet entry={entryFor("fyxer")} />);

    expect(screen.getByRole("img", { name: /^Fyxer( logo)?$/i })).toBeTruthy();
  });

  it("links back to the index", async () => {
    await renderInRouter(<WorkSheet entry={entryFor("shopify")} />);

    const back = screen.getByRole("link", { name: /work/i });
    expect(back.getAttribute("href")).toBe("/work");
  });

  it("renders the markdown body", async () => {
    await renderInRouter(<WorkSheet entry={entryFor("shopify")} />);

    expect(screen.getByText(/first as a Developer and then promoted to Senior Developer/)).toBeTruthy();
  });

  it("sets the body in the sans, so a long entry stays readable", async () => {
    const { container } = await renderInRouter(<WorkSheet entry={entryFor("shopify")} />);

    const prose = container.querySelector("[data-slot='work-prose']");
    expect(prose?.className).toContain("font-sans");
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

  it("files the entry's figures in the rail, only where there are figures to file", async () => {
    await renderInRouter(<WorkSheet entry={entryFor("fyxer")} />);
    expect(screen.getByText("ACCOUNT")).toBeTruthy();
    expect(screen.getByText("WEEKLY ACTIVES")).toBeTruthy();
    expect(screen.getByText("1,000")).toBeTruthy();
    expect(screen.getByText("TEAM")).toBeTruthy();

    cleanup();

    await renderInRouter(<WorkSheet entry={entryFor("shopify")} />);
    expect(screen.queryByText("WEEKLY ACTIVES")).toBeNull();
  });
});
