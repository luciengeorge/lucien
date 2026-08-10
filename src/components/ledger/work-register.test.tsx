import { WORK_META } from "#/lib/content/work-meta";
import { compressWorkPeriod } from "#/lib/content/work-period";
import { renderInRouter } from "#/test/render-in-router";
import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { WorkRegister, workNumeral } from "./work-register";

afterEach(() => {
  cleanup();
});

describe("workNumeral", () => {
  it("zero-pads the position", () => {
    expect(workNumeral(0)).toBe("01");
    expect(workNumeral(6)).toBe("07");
  });
});

describe("WorkRegister", () => {
  it("lists every work entry", async () => {
    await renderInRouter(<WorkRegister />);

    for (const entry of WORK_META) {
      expect(screen.getByText(entry.company)).toBeTruthy();
    }
  });

  it("links each row to its own page", async () => {
    const { container } = await renderInRouter(<WorkRegister />);

    for (const entry of WORK_META) {
      const link = container.querySelector(`a[href="/work/${entry.slug}"]`);
      expect(link).toBeTruthy();
      expect(link?.textContent).toContain(entry.company);
    }
  });

  it("marks every row with its company logo", async () => {
    await renderInRouter(<WorkRegister />);

    for (const entry of WORK_META) {
      expect(screen.getByRole("img", { name: new RegExp(`^${entry.company}( logo)?$`, "i") })).toBeTruthy();
    }
  });

  it("holds the logos to the page's two colours until the row is reached for", async () => {
    await renderInRouter(<WorkRegister />);

    const logo = screen.getByRole("img", { name: /^Fyxer( logo)?$/i });
    expect(logo.className).toContain("grayscale");
    expect(logo.className).toContain("group-hover:grayscale-0");
  });

  it("numbers the rows in sequence", async () => {
    await renderInRouter(<WorkRegister />);

    WORK_META.forEach((_entry, index) => {
      expect(screen.getByText(workNumeral(index))).toBeTruthy();
    });
  });

  it("names the role alongside the company", async () => {
    await renderInRouter(<WorkRegister />);

    expect(screen.getByText("Senior Product Engineer")).toBeTruthy();
    expect(screen.getByText("Senior Developer")).toBeTruthy();
  });

  it("compresses each period into the year column", async () => {
    await renderInRouter(<WorkRegister />);

    expect(screen.getByText("2025 · now")).toBeTruthy();
    expect(screen.getByText("2022 · 2023")).toBeTruthy();
    expect(screen.getByText("2013 · 2019")).toBeTruthy();
  });

  it("holds every period on one line, so the column cannot break in two", async () => {
    await renderInRouter(<WorkRegister />);

    for (const entry of WORK_META) {
      const period = screen.getByText(compressWorkPeriod(entry.period));
      expect(period.className).toContain("whitespace-nowrap");
    }
  });

  it("runs a leader from each company across to its dates", async () => {
    const { container } = await renderInRouter(<WorkRegister />);

    const list = container.querySelector("ul");
    expect(list?.querySelectorAll(".leader").length).toBe(WORK_META.length);
  });

  it("totals the account at the foot of the register", async () => {
    await renderInRouter(<WorkRegister />);

    expect(screen.getByText("TOTAL")).toBeTruthy();
    expect(screen.getByText(`${WORK_META.length} entries · 2013 to now`)).toBeTruthy();
  });

  it("stays a real list", async () => {
    const { container } = await renderInRouter(<WorkRegister />);

    expect(container.querySelectorAll("ul > li").length).toBe(WORK_META.length);
  });
});
