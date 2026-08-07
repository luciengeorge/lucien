import { WORK_META } from "#/lib/content/work-meta";
import { renderInRouter } from "#/test/render-in-router";
import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { WorkRegister, specimenNumeral } from "./work-register";

afterEach(() => {
  cleanup();
});

describe("specimenNumeral", () => {
  it("zero-pads the position", () => {
    expect(specimenNumeral(0)).toBe("01");
    expect(specimenNumeral(6)).toBe("07");
  });
});

describe("WorkRegister", () => {
  it("lists every work entry", async () => {
    await renderInRouter(<WorkRegister />);

    for (const entry of WORK_META) {
      expect(screen.getByText(entry.company)).toBeTruthy();
    }
  });

  it("links each record to its own sheet", async () => {
    const { container } = await renderInRouter(<WorkRegister />);

    for (const entry of WORK_META) {
      const link = container.querySelector(`a[href="/work/${entry.slug}"]`);
      expect(link).toBeTruthy();
      expect(link?.textContent).toContain(entry.company);
    }
  });

  it("marks every record with its company logo", async () => {
    await renderInRouter(<WorkRegister />);

    for (const entry of WORK_META) {
      expect(screen.getByRole("img", { name: new RegExp(`^${entry.company}( logo)?$`, "i") })).toBeTruthy();
    }
  });

  it("numbers the records in sequence", async () => {
    await renderInRouter(<WorkRegister />);

    WORK_META.forEach((_entry, index) => {
      expect(screen.getByText(specimenNumeral(index))).toBeTruthy();
    });
  });

  it("prints periods in the journal's hand, with no hyphen and a lowercase present", async () => {
    await renderInRouter(<WorkRegister />);

    expect(screen.getByText("Sep 2025 · present")).toBeTruthy();
    expect(screen.getByText("Jan 2022 · Sep 2023")).toBeTruthy();
  });

  it("stays a real list", async () => {
    const { container } = await renderInRouter(<WorkRegister />);

    expect(container.querySelectorAll("ul > li").length).toBe(WORK_META.length);
  });
});
