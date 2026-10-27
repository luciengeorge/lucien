import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();
  return { ...actual, generateText: vi.fn() };
});

import { generateText } from "ai";

import { classifyMood, MOOD_MODEL } from "./classify-mood";

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

type Call = Parameters<typeof generateText>[0];

function lastCall(): Call {
  const call = vi.mocked(generateText).mock.calls.at(-1)?.[0];
  if (!call) throw new Error("generateText was not called");
  return call;
}

describe("classifyMood", () => {
  it("picks one mood for the reply with a small model, from the visitor's question and the reply", async () => {
    vi.mocked(generateText, { partial: true }).mockResolvedValue({ output: "sheepish" });

    const mood = await classifyMood({ question: "What's his favourite colour?", reply: "I don't know that one." });

    expect(mood).toBe("sheepish");
    const call = lastCall();
    expect(call.model).toMatchObject({ modelId: MOOD_MODEL });
    expect(call.prompt).toContain("What's his favourite colour?");
    expect(call.prompt).toContain("I don't know that one.");
    expect(call.maxRetries).toBe(0);
    expect(call.providerOptions).toEqual({ openai: { reasoningEffort: "none" } });
  });

  it("only reads the start of a long reply", async () => {
    vi.mocked(generateText, { partial: true }).mockResolvedValue({ output: "proud" });

    await classifyMood({ question: "Tell me everything", reply: `${"a".repeat(5000)}THE END` });

    expect(String(lastCall().prompt).length).toBeLessThan(2500);
    expect(lastCall().prompt).not.toContain("THE END");
  });

  it("gives no mood when the model fails", async () => {
    vi.mocked(generateText).mockRejectedValue(new Error("rate limited"));
    await expect(classifyMood({ question: "Hi", reply: "Hello." })).resolves.toBeNull();
  });

  it("gives up after two seconds rather than hold the reply open", async () => {
    vi.useFakeTimers();
    vi.mocked(generateText).mockImplementation(
      ({ abortSignal }) =>
        new Promise((_resolve, reject) => {
          abortSignal?.addEventListener("abort", () => reject(new Error("aborted")));
        }),
    );

    const mood = classifyMood({ question: "Hi", reply: "Hello." });
    await vi.advanceTimersByTimeAsync(2000);

    await expect(mood).resolves.toBeNull();
  });

  it("stops when the request does", async () => {
    vi.mocked(generateText).mockImplementation(
      ({ abortSignal }) =>
        new Promise((_resolve, reject) => {
          abortSignal?.addEventListener("abort", () => reject(new Error("aborted")));
        }),
    );
    const request = new AbortController();

    const mood = classifyMood({ question: "Hi", reply: "Hello.", signal: request.signal });
    request.abort();

    await expect(mood).resolves.toBeNull();
  });
});
