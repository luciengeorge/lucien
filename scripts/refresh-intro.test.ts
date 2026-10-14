import { describe, expect, it } from "vitest";

import { contentHash } from "./refresh-intro";

describe("contentHash", () => {
  it("is stable for the same corpus, so CI reruns reuse the stored intro", () => {
    expect(contentHash("<document>a</document>")).toBe(contentHash("<document>a</document>"));
  });

  it("changes when any content changes, so an edit always gets a fresh intro", () => {
    expect(contentHash("<document>a</document>")).not.toBe(contentHash("<document>b</document>"));
  });
});
