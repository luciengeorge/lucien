import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { renderSystemPrompt } from "./system-prompt";

const template = readFileSync(join(import.meta.dirname, "..", "..", "..", "content", "system-prompt.md"), "utf-8");

describe("renderSystemPrompt", () => {
  /*
   * Without a date the model read "signed up for a 24-hour triathlon in October
   * 2026" as still upcoming on 12 October 2026, after the race had happened.
   */
  it("tells the model what day it is, in London", () => {
    const prompt = renderSystemPrompt(template, { context: "ctx", today: new Date("2026-10-11T23:30:00Z") });
    expect(prompt).toContain("Monday, 12 October 2026");
  });

  it("fills the retrieved context", () => {
    const prompt = renderSystemPrompt(template, { context: "Lucien ran a marathon.", today: new Date() });
    expect(prompt).toContain("Lucien ran a marathon.");
  });

  /* String.replace expands $' and $& in a string replacement; a code fence in a post could carry them. */
  it("inserts the context verbatim, $ patterns included", () => {
    const context = "echo $'tab\\t' and $& and $$";
    const prompt = renderSystemPrompt(template, { context, today: new Date() });
    expect(prompt).toContain(context);
  });

  it("leaves no slot unfilled", () => {
    const prompt = renderSystemPrompt(template, { context: "ctx", today: new Date() });
    expect(prompt).not.toMatch(/\{(today|context)\}/);
  });
});
