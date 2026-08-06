import { describe, expect, it } from "vitest";

import { buildWorkEntryMeta } from "./page-meta";

describe("buildWorkEntryMeta", () => {
  it("builds the title as '<role> at <company> | Lucien George' and the description as the entry summary", () => {
    const meta = buildWorkEntryMeta({
      company: "Fyxer",
      role: "Senior Product Engineer",
      summary: "Leads the notetaker app.",
    });
    expect(meta).toEqual({
      title: "Senior Product Engineer at Fyxer | Lucien George",
      description: "Leads the notetaker app.",
    });
  });
});
