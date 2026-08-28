import { renderToBuffer } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";

import { loadResume } from "./load";
import { ResumeDocument } from "./pdf-document";

function countPages(pdf: Buffer): number {
  return (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
}

function countEmbeddedImages(pdf: Buffer): number {
  return (pdf.toString("latin1").match(/\/Subtype\s*\/Image/g) ?? []).length;
}

/** Renders exactly as the route does, but against the checked-in logo files. */
async function render() {
  // Called directly rather than through JSX: this file runs in the `node`
  // vitest project, which only picks up `.ts`.
  return renderToBuffer(ResumeDocument({ baseUrl: `${process.cwd()}/public`, resume: loadResume() }));
}

describe("ResumeDocument", () => {
  /**
   * A resume that spills onto a second page is a real defect, and editing
   * `content/resume.json` is the easy way to cause one without noticing. The
   * layout is tuned to fit with roughly one bullet line to spare, so this
   * asserts the outcome rather than any particular budget.
   */
  it("renders the whole resume on a single page", async () => {
    expect(countPages(await render())).toBe(1);
  }, 30_000);

  /**
   * react-pdf drops an image it cannot read without failing the render, so a
   * broken logo source costs nothing at render time and everything on the page.
   */
  it("embeds every company logo", async () => {
    const expected = loadResume().experiences.filter((experience) => experience.logo).length;

    expect(expected).toBeGreaterThan(0);
    expect(countEmbeddedImages(await render())).toBe(expected);
  }, 30_000);
});
