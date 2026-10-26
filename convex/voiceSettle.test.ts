/// <reference types="vite/client" />

import rateLimiter from "@convex-dev/rate-limiter/test";
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type { Id } from "./_generated/dataModel";

import { api, internal } from "./_generated/api";
import schema from "./schema";
import { toVoiceTranscriptArgs } from "./voiceTranscript";

const modules = import.meta.glob(["./**/*.{ts,js}", "!./**/*.test.ts"]);

const NOW = Date.UTC(2026, 9, 15, 12, 0, 0);
const SESSION = "session-a";
const SECRET = "server-secret";
const STARTED_AT = NOW - 60_000;

function setup() {
  const t = convexTest(schema, modules);
  rateLimiter.register(t);
  return t;
}

type T = ReturnType<typeof setup>;

async function seedCall(t: T) {
  const conversationId = await t.mutation(api.conversations.createConversation, { sessionId: SESSION });
  const callId = await t.run(async (ctx) =>
    ctx.db.insert("voiceCalls", {
      conversationId,
      ip: "1.1.1.1",
      maxSecs: 300,
      sessionId: SESSION,
      startedAt: STARTED_AT,
      status: "active",
    }),
  );
  return { callId, conversationId };
}

/** What ElevenLabs returns for a finished conversation, in the shape both the webhook and its API share. */
function elevenConversation(callId: string) {
  return toVoiceTranscriptArgs({
    conversation_id: "conv_1",
    conversation_initiation_client_data: { dynamic_variables: { call_id: callId } },
    metadata: { call_duration_secs: 36, start_time_unix_secs: (STARTED_AT + 2000) / 1000 },
    transcript: [
      { message: "Hi, I'm Poof.", role: "agent", time_in_call_secs: 0 },
      { message: "Where does Lucien work?", role: "user", time_in_call_secs: 4 },
    ],
  });
}

async function voiceMessages(t: T, conversationId: Id<"conversations">) {
  const conversation = await t.query(api.conversations.getConversationById, { conversationId, sessionId: SESSION });
  return (conversation?.serializedMessages ?? []).filter((message) => message.includes('"channel":"voice"'));
}

const settle = (t: T, args: ReturnType<typeof elevenConversation>, sessionId = SESSION, serverSecret = SECRET) =>
  t.mutation(api.voiceCalls.settleVoiceCall, { ...args, serverSecret, sessionId });

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  vi.stubEnv("VOICE_SERVER_SECRET", SECRET);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("settleVoiceCall", () => {
  test("records the call's real time and transcript, and frees the visitor for another call", async () => {
    const t = setup();
    const { callId, conversationId } = await seedCall(t);

    expect(await settle(t, elevenConversation(callId))).toEqual({ settled: true });

    expect(await t.run(async (ctx) => ctx.db.get(callId))).toMatchObject({ durationSecs: 36, status: "ended" });
    expect(await voiceMessages(t, conversationId)).toHaveLength(2);
    const next = await t.mutation(api.conversations.createConversation, { sessionId: SESSION });
    expect(
      await t.mutation(api.voiceCalls.reserveVoiceCall, {
        conversationId: next,
        ip: "1.1.1.1",
        serverSecret: SECRET,
        sessionId: SESSION,
      }),
    ).toMatchObject({ allowed: true, maxSecs: 264 });
  });

  test("changes nothing for another visitor's call", async () => {
    const t = setup();
    const { callId, conversationId } = await seedCall(t);

    expect(await settle(t, elevenConversation(callId), "session-b")).toEqual({ settled: false });

    expect(await t.run(async (ctx) => ctx.db.get(callId))).toMatchObject({ status: "active" });
    expect(await voiceMessages(t, conversationId)).toHaveLength(0);
  });

  test("refuses without the server secret", async () => {
    const t = setup();
    const { callId } = await seedCall(t);

    await expect(settle(t, elevenConversation(callId), SESSION, "guess")).rejects.toThrow(/Unauthorized/);
  });

  test("and the webhook, in either order, write the call once", async () => {
    for (const order of ["settle first", "webhook first"]) {
      const t = setup();
      const { callId, conversationId } = await seedCall(t);
      const args = elevenConversation(callId);
      const webhook = () => t.mutation(internal.voiceCalls.recordVoiceTranscript, args);

      if (order === "settle first") {
        await settle(t, args);
        await webhook();
      } else {
        await webhook();
        await settle(t, args);
      }

      expect(await voiceMessages(t, conversationId)).toHaveLength(2);
      expect(await t.run(async (ctx) => ctx.db.get(callId))).toMatchObject({
        durationSecs: 36,
        elevenConversationIds: ["conv_1"],
      });
    }
  });
});
