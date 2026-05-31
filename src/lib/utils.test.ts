import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("joins string class names", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("filters falsy values (false, null, undefined, 0, empty string)", () => {
    expect(cn("a", false, null, undefined, "", 0, "b")).toBe("a b");
  });

  it("respects clsx object syntax", () => {
    expect(cn("base", { active: true, disabled: false })).toBe("base active");
  });

  it("respects clsx array syntax", () => {
    expect(cn(["a", "b"], ["c"])).toBe("a b c");
  });

  it("merges conflicting tailwind classes (last wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("preserves non-conflicting tailwind classes", () => {
    expect(cn("p-2", "m-4", "text-red-500")).toBe("p-2 m-4 text-red-500");
  });

  it("merges conflicting classes from conditional input", () => {
    expect(cn("p-2", { "p-4": true })).toBe("p-4");
  });

  it("handles nested arrays and objects", () => {
    expect(cn("a", ["b", { c: true, d: false }, ["e"]])).toBe("a b c e");
  });

  it("returns empty string when no inputs", () => {
    expect(cn()).toBe("");
  });

  it("deduplicates tailwind variants correctly (hover)", () => {
    expect(cn("hover:bg-red-500", "hover:bg-blue-500")).toBe("hover:bg-blue-500");
  });
});
