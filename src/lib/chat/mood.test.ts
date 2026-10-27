import { describe, expect, it } from "vitest";

import type { Mood } from "./mood";

import { createMoodTagFilter, moodOf, MOODS, parseMood, stripMoodTags } from "./mood";

function stream(chunks: string[]): { mood: Mood | null; text: string } {
  const filter = createMoodTagFilter();
  let text = "";
  let mood: Mood | null = null;
  for (const chunk of chunks) {
    const out = filter.push(chunk);
    text += out.text;
    mood = out.mood ?? mood;
  }
  return { mood, text: text + filter.flush() };
}

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

describe("the mood tag filter", () => {
  it("takes the mood from the tag that opens a reply and drops the tag", () => {
    expect(stream(["<mood>happy</mood>\n\nLucien ran a marathon."])).toEqual({
      mood: "happy",
      text: "Lucien ran a marathon.",
    });
  });

  it("handles the tag arriving split across chunks", () => {
    expect(stream(["<", "mo", "od>exc", "ited</m", "ood>", " He", " did!"])).toEqual({
      mood: "excited",
      text: "He did!",
    });
  });

  it("holds nothing back that cannot be a tag", () => {
    const filter = createMoodTagFilter();
    expect(filter.push("Lucien <3 dogs").text).toBe("Lucien <3 dogs");
    expect(filter.push(" and a < b").text).toBe(" and a < b");
  });

  it("releases a held-back start that never became a tag", () => {
    expect(stream(["Use <mo", "re> tags"])).toEqual({ mood: null, text: "Use <more> tags" });
    expect(stream(["The end <mood"])).toEqual({ mood: null, text: "The end <mood" });
  });

  it("is neutral when the reply has no tag", () => {
    expect(stream(["Lucien lives ", "in London."])).toEqual({ mood: null, text: "Lucien lives in London." });
  });

  it("strips a tag with a value it does not know, and stays neutral", () => {
    expect(stream(["<mood>furious</mood>Hello."])).toEqual({ mood: null, text: "Hello." });
  });

  it("strips a tag in the middle of a reply without changing the mood", () => {
    expect(stream(["<mood>curious</mood>Hi. ", "<mood>proud</mood>", "Bye."])).toEqual({
      mood: "curious",
      text: "Hi. Bye.",
    });
    expect(stream(["Hi. <mood>proud</mood>Bye."])).toEqual({ mood: null, text: "Hi. Bye." });
  });

  it("reports the mood once, on the chunk that completes the tag", () => {
    const filter = createMoodTagFilter();
    expect(filter.push("<mood>sheep")).toEqual({ text: "" });
    expect(filter.push("ish</mood>I")).toEqual({ mood: "sheepish", text: "I" });
    expect(filter.push(" don't know.")).toEqual({ text: " don't know." });
  });
});

describe("stripMoodTags", () => {
  it("cleans a finished text the same way the stream does", () => {
    expect(stripMoodTags("<mood>proud</mood>\nHe shipped it.")).toBe("He shipped it.");
    expect(stripMoodTags("No tag here.")).toBe("No tag here.");
    expect(stripMoodTags("A <mood>happy</mood>B")).toBe("A B");
  });
});
