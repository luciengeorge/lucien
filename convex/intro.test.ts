/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { afterEach, describe, expect, it, vi } from "vitest";

import { api, internal } from "./_generated/api";
import schema from "./schema";

const generateText = vi.fn();
vi.mock("ai", () => ({ generateText: (...args: unknown[]) => generateText(...args) }));
vi.mock("@ai-sdk/openai", () => ({ openai: (model: string) => model }));

const modules = import.meta.glob(["./**/*.{ts,js}", "!./**/*.test.ts"]);

afterEach(() => {
  generateText.mockReset();
});

describe("intro", () => {
  it("has nothing cached before the first refresh, so callers fall back to their static intro", async () => {
    const t = convexTest(schema, modules);

    expect(await t.action(api.intro.getCachedIntro, {})).toBeNull();
  });

  it("writes the intro from the whole corpus and serves it", async () => {
    const t = convexTest(schema, modules);
    generateText.mockResolvedValue({ text: "Hi, I'm Poof — Lucien's assistant." });

    await t.action(internal.intro.refreshIntro, { contentHash: "abc", corpus: "<document>Lucien</document>" });

    expect(generateText).toHaveBeenCalledTimes(1);
    expect(generateText.mock.calls[0]?.[0].system).toContain("<document>Lucien</document>");
    expect(await t.action(api.intro.getCachedIntro, {})).toBe("Hi, I'm Poof - Lucien's assistant.");
  });

  it("puts the corpus in verbatim, even where it reads like a replace pattern", async () => {
    const t = convexTest(schema, modules);
    generateText.mockResolvedValue({ text: "Hello." });

    await t.action(internal.intro.refreshIntro, { contentHash: "abc", corpus: "costs $& and $1" });

    expect(generateText.mock.calls[0]?.[0].system).toContain("costs $& and $1");
  });

  it("generates once per content version, so reruns cost nothing", async () => {
    const t = convexTest(schema, modules);
    generateText.mockResolvedValue({ text: "Hello." });

    await t.action(internal.intro.refreshIntro, { contentHash: "abc", corpus: "v1" });
    await t.action(internal.intro.refreshIntro, { contentHash: "abc", corpus: "v1" });

    expect(generateText).toHaveBeenCalledTimes(1);
  });

  it("serves the intro for the newest content once it changes", async () => {
    const t = convexTest(schema, modules);
    generateText.mockResolvedValueOnce({ text: "Old intro." }).mockResolvedValueOnce({ text: "New intro." });

    await t.action(internal.intro.refreshIntro, { contentHash: "old", corpus: "v1" });
    await t.action(internal.intro.refreshIntro, { contentHash: "new", corpus: "v2" });

    expect(await t.action(api.intro.getCachedIntro, {})).toBe("New intro.");
  });
});
