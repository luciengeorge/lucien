import { describe, expect, it } from "vitest";

import { cleanVoiceText, correctSpokenNames, stripAudioTags } from "./strip-audio-tags";

describe("stripAudioTags", () => {
  it("removes a leading tag", () => {
    expect(stripAudioTags("[thoughtful] Lucien studied at McGill.")).toBe("Lucien studied at McGill.");
  });

  it("removes a mid-text tag and tidies the gap", () => {
    expect(stripAudioTags("Well [pause] he moved.")).toBe("Well he moved.");
    expect(stripAudioTags("Sure [laughs], yes.")).toBe("Sure, yes.");
  });

  it("removes several tags, including two-word and hyphenated ones", () => {
    expect(stripAudioTags("[neutral] Hi. [short pause] Yes. [self-assured] Done.")).toBe("Hi. Yes. Done.");
  });

  it("leaves other brackets alone", () => {
    expect(stripAudioTags("See [1] and [Link](https://x.dev) and [link](https://x.dev).")).toBe(
      "See [1] and [Link](https://x.dev) and [link](https://x.dev).",
    );
    expect(stripAudioTags("Fyxer [UK] team")).toBe("Fyxer [UK] team");
  });

  it("leaves text with no tags untouched, double spaces included", () => {
    expect(stripAudioTags("a  b")).toBe("a  b");
  });
});

describe("correctSpokenNames", () => {
  it("writes the visitor's Lucien as Lucien, keeping case and the plural", () => {
    expect(correctSpokenNames("How can I contact Lucian?")).toBe("How can I contact Lucien?");
    expect(correctSpokenNames("lucian, LUCIAN and Lucian's")).toBe("lucien, LUCIEN and Lucien's");
    expect(correctSpokenNames("Lucians site")).toBe("Luciens site");
  });

  it("leaves other words alone", () => {
    expect(correctSpokenNames("Lucianne and Lucien")).toBe("Lucianne and Lucien");
  });
});

describe("cleanVoiceText", () => {
  it("strips tags from agent turns and fixes names in visitor turns only", () => {
    expect(cleanVoiceText("[happy] Lucian is Lucien.", "agent")).toBe("Lucian is Lucien.");
    expect(cleanVoiceText("[happy] Lucian is Lucien.", "assistant")).toBe("Lucian is Lucien.");
    expect(cleanVoiceText("[happy] Lucian", "user")).toBe("[happy] Lucien");
  });
});
