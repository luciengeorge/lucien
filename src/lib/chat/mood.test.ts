import { describe, expect, it } from "vitest";

import { moodOf, MOODS, parseMood } from "./mood";

describe("moods", () => {
  it("is the exact set Poof can feel, plus neutral", () => {
    expect(MOODS).toEqual(["neutral", "happy", "excited", "curious", "thoughtful", "surprised", "proud", "sheepish"]);
  });

  it("reads a known mood and nothing else", () => {
    expect(parseMood("sheepish")).toBe("sheepish");
    expect(parseMood(" Proud ")).toBe("proud");
    expect(parseMood("angry")).toBeNull();
    expect(parseMood(3)).toBeNull();
    expect(parseMood(undefined)).toBeNull();
  });
});

describe("moodOf", () => {
  it("reads the mood off a message's metadata or a set_mood call, and nothing else", () => {
    expect(moodOf({ mood: "curious" })).toBe("curious");
    expect(moodOf({ mood: "grumpy" })).toBeNull();
    expect(moodOf({ callId: "c1", channel: "voice" })).toBeNull();
    expect(moodOf(null)).toBeNull();
    expect(moodOf("happy")).toBeNull();
  });
});
