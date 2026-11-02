import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("#/lib/functions/release-voice-call", () => ({ releaseVoiceCall: vi.fn() }));
vi.mock("#/lib/functions/start-voice-call", () => ({ checkVoiceResting: vi.fn(), startVoiceCall: vi.fn() }));

import { checkVoiceResting, startVoiceCall } from "#/lib/functions/start-voice-call";

import { microphoneRefusal, requestVoiceCall, waitForConversation } from "./chat-voice-start";

const granted = { callId: "c", conversationId: "x", maxSecs: 240, ok: true, today: "Monday", token: "t" } as const;

describe("requestVoiceCall", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [] }) } });
    vi.mocked(checkVoiceResting).mockResolvedValue(false);
    vi.mocked(startVoiceCall).mockResolvedValue(granted);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("waits for the conversation after the mic, then starts the call", async () => {
    let ready!: () => void;
    const result = requestVoiceCall(() => new Promise<void>((resolve) => (ready = resolve)));
    await vi.waitFor(() => expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled());
    await Promise.resolve();
    expect(startVoiceCall).not.toHaveBeenCalled();
    ready();
    expect(await result).toEqual(granted);
    expect(startVoiceCall).toHaveBeenCalledTimes(1);
  });

  it("never starts the call once the visitor has left, even when the conversation arrives after", async () => {
    const leave = new AbortController();
    let ready!: () => void;
    const result = requestVoiceCall(() => new Promise<void>((resolve) => (ready = resolve)), leave.signal);
    await vi.waitFor(() => expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled());
    leave.abort();
    ready();
    expect(await result).toEqual({ ok: false, reason: "connect_failed" });
    expect(startVoiceCall).not.toHaveBeenCalled();
  });

  it("refuses with connect_failed and makes no server call when the conversation never comes", async () => {
    const result = await requestVoiceCall(() => Promise.reject(new Error("no conversation")));
    expect(result).toEqual({ ok: false, reason: "connect_failed" });
    expect(startVoiceCall).not.toHaveBeenCalled();
  });
});

describe("waitForConversation", () => {
  afterEach(() => vi.useRealTimers());

  it("resolves at once when the conversation exists", async () => {
    await expect(waitForConversation(() => "ready")).resolves.toBeUndefined();
  });

  it("resolves when it arrives later", async () => {
    vi.useFakeTimers();
    let state: "pending" | "ready" = "pending";
    const done = waitForConversation(() => state);
    state = "ready";
    await vi.advanceTimersByTimeAsync(100);
    await expect(done).resolves.toBeUndefined();
  });

  it("rejects when creation failed", async () => {
    await expect(waitForConversation(() => "failed")).rejects.toThrow();
  });

  it("stops polling as soon as the visitor leaves", async () => {
    vi.useFakeTimers();
    const leave = new AbortController();
    const read = vi.fn((): "pending" => "pending");
    const done = waitForConversation(read, 10_000, leave.signal);
    const assertion = expect(done).rejects.toThrow();
    leave.abort();
    await assertion;
    const readsAtAbort = read.mock.calls.length;
    await vi.advanceTimersByTimeAsync(500);
    expect(read).toHaveBeenCalledTimes(readsAtAbort);
  });

  it("rejects after the timeout", async () => {
    vi.useFakeTimers();
    const done = waitForConversation(() => "pending", 1000);
    const assertion = expect(done).rejects.toThrow();
    await vi.advanceTimersByTimeAsync(1200);
    await assertion;
  });
});

describe("microphoneRefusal", () => {
  it("tells a visitor who blocked the site to allow it", () => {
    expect(microphoneRefusal(new DOMException("Permission denied", "NotAllowedError"))).toBe("mic_denied");
    expect(microphoneRefusal(new DOMException("Insecure", "SecurityError"))).toBe("mic_denied");
  });

  it("points at the computer's settings when the system, not the site, blocks the mic", () => {
    expect(microphoneRefusal(new DOMException("Permission denied by system", "NotAllowedError"))).toBe(
      "mic_blocked_system",
    );
  });

  it("says when there is no microphone at all", () => {
    expect(microphoneRefusal(new DOMException("Requested device not found", "NotFoundError"))).toBe("mic_missing");
  });

  it("says when another app holds the microphone", () => {
    expect(microphoneRefusal(new DOMException("Could not start audio source", "NotReadableError"))).toBe("mic_busy");
  });

  it("is not a microphone problem otherwise", () => {
    expect(microphoneRefusal(new Error("network"))).toBeNull();
    expect(microphoneRefusal(new DOMException("aborted", "AbortError"))).toBeNull();
  });
});
