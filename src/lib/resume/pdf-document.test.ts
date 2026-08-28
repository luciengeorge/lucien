import { renderToBuffer } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";

import { loadResume } from "./load";
import { ResumeDocument } from "./pdf-document";

/**
 * A resume that spills onto a second page is a real defect, and editing
 * `content/resume.json` is the easy way to cause one without noticing. The
 * layout is tuned to fit with roughly one bullet line to spare, so this asserts
 * the outcome rather than any particular budget.
 */
function countPages(pdf: Buffer): number {
  return (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
}

describe("ResumeDocument", () => {
  it("renders the whole resume on a single page", async () => {
    // Called directly rather than through JSX: this file runs in the `node`
    // vitest project, which only picks up `.ts`.
    const buffer = await renderToBuffer(ResumeDocument({ baseUrl: `${process.cwd()}/public`, resume: loadResume() }));

    expect(countPages(buffer)).toBe(1);
  }, 30_000);
});
