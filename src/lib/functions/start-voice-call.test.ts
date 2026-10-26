import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("#/lib/auth-server", () => ({ fetchAuthMutation: vi.fn() }));
vi.mock("#/lib/conversation-session.server", () => ({ getConversationSession: vi.fn() }));
vi.mock("#/lib/functions/start-new-conversation", () => ({ startConversation: vi.fn() }));
vi.mock("@tanstack/react-start/server", () => ({ getRequestHeader: vi.fn() }));

import { fetchAuthMutation } from "#/lib/auth-server";
import { getConversationSession } from "#/lib/conversation-session.server";
import { startConversation } from "#/lib/functions/start-new-conversation";
import { VOICE_AGENT_ID } from "#/lib/voice/agent-config";
import { getRequestHeader } from "@tanstack/react-start/server";
import { getFunctionName } from "convex/server";

import { startVoiceCallForRequest } from "./start-voice-call";

const NOW = new Date("2026-10-11T23:30:00Z");

function mutationCalls(name: string) {
  return vi
    .mocked(fetchAuthMutation)
    .mock.calls.filter(([fn]) => getFunctionName(fn) === name)
    .map(([, args]) => args);
}

function respondToReserve(result: unknown) {
  vi.mocked(fetchAuthMutation).mockImplementation(async (...[fn]) =>
    getFunctionName(fn) === "voiceCalls:reserveVoiceCall" ? result : null,
  );
}

const fetchMock = vi.fn<typeof fetch>();

describe("startVoiceCallForRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("ELEVENLABS_API_KEY", "el-key");
    vi.stubEnv("VOICE_SERVER_SECRET", "server-secret");
    vi.mocked(getRequestHeader).mockImplementation((name) =>
      name === "x-forwarded-for" ? "9.9.9.9, 10.0.0.1" : undefined,
    );
    vi.mocked(getConversationSession, { partial: true }).mockResolvedValue({
      data: { conversationId: "conv-1", sessionId: "sess-1" },
    });
    respondToReserve({ allowed: true, callId: "call-1", maxSecs: 240 });
    fetchMock.mockResolvedValue(Response.json({ token: "webrtc-token" }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("reserves time for the visitor's conversation and hands back a call token", async () => {
    const result = await startVoiceCallForRequest("corr");

    expect(result).toEqual({
      callId: "call-1",
      conversationId: "conv-1",
      maxSecs: 240,
      ok: true,
      today: "Monday, 12 October 2026",
      token: "webrtc-token",
    });
    expect(mutationCalls("voiceCalls:reserveVoiceCall")).toEqual([
      { conversationId: "conv-1", ip: "9.9.9.9", serverSecret: "server-secret", sessionId: "sess-1" },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${VOICE_AGENT_ID}`,
      { headers: { "xi-api-key": "el-key" } },
    );
  });

  it("starts a conversation first for a visitor who has none", async () => {
    vi.mocked(getConversationSession, { partial: true }).mockResolvedValue({ data: {} });
    vi.mocked(startConversation).mockResolvedValue({
      conversation: { createdAt: 0, id: "conv-new", sessionId: "sess-new", updatedAt: 0 },
      serializedMessages: [],
    });

    const result = await startVoiceCallForRequest("corr");

    expect(result).toMatchObject({ conversationId: "conv-new", ok: true });
    expect(mutationCalls("voiceCalls:reserveVoiceCall")).toEqual([
      { conversationId: "conv-new", ip: "9.9.9.9", serverSecret: "server-secret", sessionId: "sess-new" },
    ]);
  });

  it("says why when the visitor has no time left, without minting a token", async () => {
    respondToReserve({ allowed: false, reason: "visitor_limit", retryAfter: 1000 });

    expect(await startVoiceCallForRequest("corr")).toEqual({ ok: false, reason: "visitor_limit" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("gives the reservation back when no token can be minted", async () => {
    fetchMock.mockResolvedValue(new Response("boom", { status: 500 }));

    expect(await startVoiceCallForRequest("corr")).toEqual({ ok: false, reason: "unavailable" });
    expect(mutationCalls("voiceCalls:releaseVoiceCall")).toEqual([
      { callId: "call-1", serverSecret: "server-secret", sessionId: "sess-1" },
    ]);
  });

  it("does not reserve anything when the API key is missing", async () => {
    vi.stubEnv("ELEVENLABS_API_KEY", "");

    expect(await startVoiceCallForRequest("corr")).toEqual({ ok: false, reason: "unavailable" });
    expect(mutationCalls("voiceCalls:reserveVoiceCall")).toEqual([]);
  });

  it("does not reserve anything when the server secret is missing", async () => {
    vi.stubEnv("VOICE_SERVER_SECRET", "");

    expect(await startVoiceCallForRequest("corr")).toEqual({ ok: false, reason: "unavailable" });
    expect(mutationCalls("voiceCalls:reserveVoiceCall")).toEqual([]);
  });

  /* x-vercel-id is unique per request, so it would give every call a fresh IP allowance. */
  it("falls back to x-real-ip, then one shared bucket, for the visitor's IP", async () => {
    vi.mocked(getRequestHeader).mockImplementation((name) =>
      name === "x-real-ip" ? "8.8.8.8" : name === "x-vercel-id" ? "req-1" : undefined,
    );
    await startVoiceCallForRequest("corr");
    vi.mocked(getRequestHeader).mockImplementation((name) => (name === "x-vercel-id" ? "req-2" : undefined));
    await startVoiceCallForRequest("corr");

    expect(mutationCalls("voiceCalls:reserveVoiceCall").map((args) => args?.ip)).toEqual(["8.8.8.8", "unknown"]);
  });
});
