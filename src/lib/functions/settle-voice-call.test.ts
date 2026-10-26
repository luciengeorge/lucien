import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("#/lib/auth-server", () => ({ fetchAuthMutation: vi.fn() }));
vi.mock("#/lib/conversation-session.server", () => ({ getConversationSession: vi.fn() }));

import { fetchAuthMutation } from "#/lib/auth-server";
import { getConversationSession } from "#/lib/conversation-session.server";
import { VOICE_AGENT_ID } from "#/lib/voice/agent-config";
import { getFunctionName } from "convex/server";

import { settleVoiceCallForRequest } from "./settle-voice-call";

const fetchMock = vi.fn<typeof fetch>();

/** The conversations API's answer, trimmed to what matters (the live one carries far more). */
function conversation({
  agentId = VOICE_AGENT_ID,
  callId = "call-1",
  status = "done",
}: { agentId?: string; callId?: string; status?: string } = {}) {
  return {
    agent_id: agentId,
    conversation_id: "conv_1",
    conversation_initiation_client_data: { dynamic_variables: { call_id: callId, today: "Monday" } },
    metadata: { call_duration_secs: 36, start_time_unix_secs: 1_793_028_760 },
    status,
    transcript: [
      { message: "Hi, I'm Poof.", role: "agent", time_in_call_secs: 0 },
      { message: "Hello, Poof.", role: "user", time_in_call_secs: 4 },
    ],
  };
}

const settle = () => settleVoiceCallForRequest({ callId: "call-1", elevenConversationId: "conv_1" }, { waitMs: 0 });

describe("settleVoiceCallForRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("ELEVENLABS_API_KEY", "el-key");
    vi.stubEnv("VOICE_SERVER_SECRET", "server-secret");
    vi.mocked(getConversationSession, { partial: true }).mockResolvedValue({ data: { sessionId: "sess-1" } });
    vi.mocked(fetchAuthMutation).mockResolvedValue({ settled: true });
    fetchMock.mockImplementation(async () => Response.json(conversation()));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("settles the call from what ElevenLabs says happened, as the cookie's session", async () => {
    expect(await settle()).toEqual({ status: "settled" });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("https://api.elevenlabs.io/v1/convai/conversations/conv_1");
    expect(new Headers(init?.headers).get("xi-api-key")).toBe("el-key");
    const [fn, args] = vi.mocked(fetchAuthMutation).mock.calls[0] ?? [];
    expect(fn && getFunctionName(fn)).toBe("voiceCalls:settleVoiceCall");
    expect(args).toEqual({
      callId: "call-1",
      conversationStartedAtSecs: 1_793_028_760,
      durationSecs: 36,
      elevenConversationId: "conv_1",
      serverSecret: "server-secret",
      sessionId: "sess-1",
      transcript: [
        { index: 0, message: "Hi, I'm Poof.", role: "agent", timeInCallSecs: 0 },
        { index: 1, message: "Hello, Poof.", role: "user", timeInCallSecs: 4 },
      ],
    });
  });

  it.each([
    ["another agent's conversation", { agentId: "agent_other" }],
    ["a conversation from another call", { callId: "call-2" }],
  ])("rejects %s and changes nothing", async (_name, overrides) => {
    fetchMock.mockImplementation(async () => Response.json(conversation(overrides)));

    expect(await settle()).toEqual({ status: "rejected" });
    expect(fetchAuthMutation).not.toHaveBeenCalled();
  });

  it("rejects a call Convex says is not this session's", async () => {
    vi.mocked(fetchAuthMutation).mockResolvedValue({ settled: false });

    expect(await settle()).toEqual({ status: "rejected" });
  });

  it("reports failed, rather than throwing, when Convex cannot record the call", async () => {
    vi.mocked(fetchAuthMutation).mockRejectedValue(new Error("Could not find public function"));

    expect(await settle()).toEqual({ status: "failed" });
  });

  it("waits out ElevenLabs' processing, then settles", async () => {
    fetchMock
      .mockImplementationOnce(async () => Response.json(conversation({ status: "processing" })))
      .mockImplementationOnce(async () => Response.json(conversation({ status: "processing" })));

    expect(await settle()).toEqual({ status: "settled" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("is pending when ElevenLabs is still processing after a few tries, leaving it to the webhook", async () => {
    fetchMock.mockImplementation(async () => Response.json(conversation({ status: "processing" })));

    expect(await settle()).toEqual({ status: "pending" });
    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(3);
    expect(fetchAuthMutation).not.toHaveBeenCalled();
  });

  it("does nothing for an id that is not an ElevenLabs conversation id", async () => {
    expect(
      await settleVoiceCallForRequest({ callId: "call-1", elevenConversationId: "../agents" }, { waitMs: 0 }),
    ).toEqual({ status: "rejected" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does nothing without a session", async () => {
    vi.mocked(getConversationSession, { partial: true }).mockResolvedValue({ data: {} });

    expect(await settle()).toEqual({ status: "failed" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
