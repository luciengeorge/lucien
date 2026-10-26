import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("#/lib/auth-server", () => ({ fetchAuthMutation: vi.fn() }));
vi.mock("#/lib/conversation-session.server", () => ({ getConversationSession: vi.fn() }));

import { fetchAuthMutation } from "#/lib/auth-server";
import { getConversationSession } from "#/lib/conversation-session.server";
import { getFunctionName } from "convex/server";

import { releaseVoiceCallForRequest } from "./release-voice-call";

describe("releaseVoiceCallForRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("VOICE_SERVER_SECRET", "server-secret");
    vi.mocked(getConversationSession, { partial: true }).mockResolvedValue({ data: { sessionId: "sess-1" } });
    vi.mocked(fetchAuthMutation).mockResolvedValue(null);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("hands the call back as the cookie's session, with the server secret", async () => {
    await releaseVoiceCallForRequest({ callId: "call-1" });

    const [fn, args] = vi.mocked(fetchAuthMutation).mock.calls[0] ?? [];
    expect(fn && getFunctionName(fn)).toBe("voiceCalls:releaseVoiceCall");
    expect(args).toEqual({ callId: "call-1", serverSecret: "server-secret", sessionId: "sess-1" });
  });

  it("does nothing without a session or a secret", async () => {
    vi.mocked(getConversationSession, { partial: true }).mockResolvedValue({ data: {} });
    await releaseVoiceCallForRequest({ callId: "call-1" });
    vi.mocked(getConversationSession, { partial: true }).mockResolvedValue({ data: { sessionId: "sess-1" } });
    vi.stubEnv("VOICE_SERVER_SECRET", "");
    await releaseVoiceCallForRequest({ callId: "call-1" });

    expect(fetchAuthMutation).not.toHaveBeenCalled();
  });

  it("never throws, so a failed release cannot break closing the call", async () => {
    vi.mocked(fetchAuthMutation).mockRejectedValue(new Error("bad id"));
    await expect(releaseVoiceCallForRequest({ callId: "nonsense" })).resolves.toBeNull();
  });
});
