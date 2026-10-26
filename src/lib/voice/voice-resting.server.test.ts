import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("#/lib/auth-server", () => ({ fetchAuthQuery: vi.fn() }));

import { fetchAuthQuery } from "#/lib/auth-server";
import { getFunctionName } from "convex/server";

import { isVoiceResting, voiceRestingForPage } from "./voice-resting.server";

describe("voice resting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("VITE_VOICE_ENABLED", "true");
    vi.mocked(fetchAuthQuery).mockResolvedValue(true);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("asks Convex's breaker", async () => {
    expect(await isVoiceResting()).toBe(true);
    expect(getFunctionName(vi.mocked(fetchAuthQuery).mock.calls[0]?.[0] ?? "")).toBe("voiceOutages:isVoiceResting");
  });

  it("reads as available when the breaker cannot be read, leaving the call itself to decide", async () => {
    vi.mocked(fetchAuthQuery).mockRejectedValue(new Error("down"));
    expect(await isVoiceResting()).toBe(false);
  });

  it("costs the page nothing when voice is off", async () => {
    vi.stubEnv("VITE_VOICE_ENABLED", "");
    expect(await voiceRestingForPage()).toBe(false);
    expect(fetchAuthQuery).not.toHaveBeenCalled();
  });

  it("tells the page when voice is on", async () => {
    expect(await voiceRestingForPage()).toBe(true);
  });
});
