import { describe, expect, it } from "vitest";

import { gradedAnswer, passes, replyMood } from "./answer";

describe("gradedAnswer", () => {
  it("grades the reply a visitor reads, without the mood tag the face takes", () => {
    expect(gradedAnswer("<mood>sheepish</mood>\n\nI don't know that one.")).toBe("I don't know that one.");
    expect(gradedAnswer("No tag at all.")).toBe("No tag at all.");
  });
});

describe("replyMood", () => {
  it("reads the mood tag a reply opens with, the same way the chat route does", () => {
    expect(replyMood("<mood>proud</mood>\nHe built it.")).toBe("proud");
    expect(replyMood("He built it.")).toBeNull();
    expect(replyMood("<mood>grumpy</mood>He built it.")).toBeNull();
    expect(replyMood("He built it. <mood>proud</mood>")).toBeNull();
  });
});

describe("passes", () => {
  /* Saved replies lose their tag, so a long chat can teach the model to drop it: that must fail loudly. */
  it("fails a reply that does not open with a valid mood tag, however well it scores", () => {
    const verdict = { criteria: {}, reasoning: "", score: 0.95 };
    expect(passes(verdict, "happy")).toBe(true);
    expect(passes(verdict, null)).toBe(false);
    expect(passes({ ...verdict, score: 0.5 }, "happy")).toBe(false);
    expect(passes({ error: "judge crashed" }, "happy")).toBe(false);
  });
});
