import { loadResume } from "#/lib/resume/load";
import { SOCIAL_LINKS } from "#/lib/social-links";
import { renderInRouter } from "#/test/render-in-router";
import { cleanup, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { LedgerColophon, LedgerNav, NAV_ITEMS } from "./ledger-nav";

afterEach(() => {
  cleanup();
});

describe("LedgerNav", () => {
  it("lands the wordmark on home and draws the mark beside it", async () => {
    const { container } = await renderInRouter(<LedgerNav />);

    const masthead = screen.getByRole("link", { name: "Lucien George | Home" });
    expect(masthead.getAttribute("href")).toBe("/");
    expect(container.querySelector("svg[aria-hidden='true']")).toBeTruthy();
  });

  it("exposes every section as a link to its own route", async () => {
    await renderInRouter(<LedgerNav />);

    const nav = screen.getByRole("navigation", { name: "Primary" });
    for (const item of NAV_ITEMS) {
      expect(within(nav).getByRole("link", { name: item.label }).getAttribute("href")).toBe(item.to);
    }
  });

  it("orders the sections so the page you are reading comes first", () => {
    expect(NAV_ITEMS.map((item) => item.label)).toEqual(["Ask", "Work", "About", "Skills", "Education", "Resume"]);
  });

  it("marks the current section with a stamp the screen reader does not read twice", async () => {
    await renderInRouter(<LedgerNav />);

    const nav = screen.getByRole("navigation", { name: "Primary" });
    const ask = within(nav).getByRole("link", { name: "Ask" });

    expect(ask.getAttribute("data-status")).toBe("active");
    expect(ask.querySelector("[aria-hidden='true']")).toBeTruthy();
    expect(ask.textContent).toBe("Ask");
  });
});

describe("LedgerColophon", () => {
  it("is the site's contentinfo landmark", async () => {
    await renderInRouter(<LedgerColophon />);

    expect(screen.getByRole("contentinfo")).toBeTruthy();
  });

  it("carries the email and every social link", async () => {
    await renderInRouter(<LedgerColophon />);

    const colophon = screen.getByRole("contentinfo");
    const email = loadResume().personal.email;
    expect(within(colophon).getByRole("link", { name: email }).getAttribute("href")).toBe(`mailto:${email}`);
    for (const link of SOCIAL_LINKS) {
      expect(within(colophon).getByRole("link", { name: link.label }).getAttribute("href")).toBe(link.href);
    }
  });

  it("stamps the account as still open", async () => {
    await renderInRouter(<LedgerColophon />);

    expect(within(screen.getByRole("contentinfo")).getByText("STILL SHIPPING")).toBeTruthy();
  });
});
