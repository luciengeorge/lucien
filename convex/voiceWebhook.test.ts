/// <reference types="vite/client" />

import rateLimiter from "@convex-dev/rate-limiter/test";
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type { Id } from "./_generated/dataModel";

import { api } from "./_generated/api";
import schema from "./schema";
import { VOICE_AGENT_ID } from "./voiceAgent";

const modules = import.meta.glob(["./**/*.{ts,js}", "!./**/*.test.ts"]);

const NOW = Date.UTC(2026, 9, 15, 12, 0, 0);
const MINUTE = 60_000;
const SESSION = "session-a";
const WEBHOOK_SECRET = "wsec_test";
const SERVER_SECRET = "server-secret";
const STARTED_AT = NOW - 5 * MINUTE;
const CONVERSATION_START = STARTED_AT + 2000;
const EM_DASH = String.fromCodePoint(0x2014);
const EN_DASH = String.fromCodePoint(0x2013);

function setup() {
  const t = convexTest(schema, modules);
  rateLimiter.register(t);
  return t;
}

type T = ReturnType<typeof setup>;

interface Turn {
  role: string;
  message: string | null;
  time_in_call_secs: number;
  tool_calls?: unknown[];
}

const TRANSCRIPT: Turn[] = [
  { role: "agent", message: "Hi, I'm Poof. What would you like to know?", time_in_call_secs: 0 },
  { role: "user", message: "Where does Lucien work?", time_in_call_secs: 4 },
  { role: "agent", message: null, time_in_call_secs: 6, tool_calls: [{ tool_name: "show_contact_form" }] },
  { role: "agent", message: "   ", time_in_call_secs: 7 },
  { role: "agent", message: "He works at Fyxer.", time_in_call_secs: 9 },
];

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

interface PayloadOptions {
  agentId?: string;
  conversationId?: string;
  durationSecs?: number;
  startTimeSecs?: number;
  transcript?: unknown[];
  type?: string;
}

function payload(
  callId: string,
  {
    agentId = VOICE_AGENT_ID,
    conversationId = "conv_1",
    durationSecs = 42,
    startTimeSecs = CONVERSATION_START / 1000,
    transcript = TRANSCRIPT,
    type = "post_call_transcription",
  }: PayloadOptions = {},
) {
  return JSON.stringify({
    type,
    event_timestamp: NOW / 1000,
    data: {
      agent_id: agentId,
      conversation_id: conversationId,
      status: "done",
      transcript,
      metadata: { call_duration_secs: durationSecs, start_time_unix_secs: startTimeSecs, cost: 100 },
      analysis: { transcript_summary: "Asked where Lucien works." },
      conversation_initiation_client_data: { dynamic_variables: { call_id: callId, today: "15 October 2026" } },
    },
  });
}

async function sign(body: string, timestamp: number, secret = WEBHOOK_SECRET) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${body}`));
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `t=${timestamp},v0=${hex}`;
}

async function post(t: T, body: string, signature?: string) {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (signature !== undefined) headers.set("ElevenLabs-Signature", signature);
  return await t.fetch("/elevenlabs/post-call", { body, headers, method: "POST" });
}

async function postSigned(t: T, body: string) {
  return await post(t, body, await sign(body, Math.floor(NOW / 1000)));
}

async function storedMessages(t: T) {
  return await t.run(async (ctx) => ctx.db.query("messages").collect());
}

async function getCall(t: T, callId: Id<"voiceCalls">) {
  return await t.run(async (ctx) => ctx.db.get(callId));
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  vi.stubEnv("ELEVENLABS_WEBHOOK_SECRET", WEBHOOK_SECRET);
  vi.stubEnv("VOICE_SERVER_SECRET", SERVER_SECRET);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("signature", () => {
  test("accepts a correctly signed delivery", async () => {
    const t = setup();
    const { callId } = await seedCall(t);

    const response = await postSigned(t, payload(callId));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  test("refuses a signature made with another secret, writing nothing", async () => {
    const t = setup();
    const { callId } = await seedCall(t);
    const body = payload(callId);

    const response = await post(t, body, await sign(body, Math.floor(NOW / 1000), "wrong"));

    expect(response.status).toBe(401);
    expect(await storedMessages(t)).toHaveLength(0);
    expect(await getCall(t, callId)).toMatchObject({ status: "active" });
  });

  test("refuses a body changed after signing", async () => {
    const t = setup();
    const { callId } = await seedCall(t);
    const signature = await sign(payload(callId), Math.floor(NOW / 1000));

    const response = await post(t, payload(callId, { transcript: [] }), signature);

    expect(response.status).toBe(401);
  });

  test("refuses a missing or malformed header", async () => {
    const t = setup();
    const { callId } = await seedCall(t);
    const body = payload(callId);

    expect((await post(t, body)).status).toBe(401);
    expect((await post(t, body, "garbage")).status).toBe(401);
    expect((await post(t, body, `t=${Math.floor(NOW / 1000)},v0=zz`)).status).toBe(401);
    expect(await storedMessages(t)).toHaveLength(0);
  });

  test("refuses a delivery signed more than 30 minutes ago", async () => {
    const t = setup();
    const { callId } = await seedCall(t);
    const body = payload(callId);

    const response = await post(t, body, await sign(body, Math.floor((NOW - 31 * MINUTE) / 1000)));

    expect(response.status).toBe(401);
    expect(await storedMessages(t)).toHaveLength(0);
  });

  test("refuses everything when the deployment has no webhook secret", async () => {
    vi.stubEnv("ELEVENLABS_WEBHOOK_SECRET", "");
    const t = setup();
    const { callId } = await seedCall(t);
    const body = payload(callId);

    const response = await post(t, body, await sign(body, Math.floor(NOW / 1000), "any"));

    expect(response.status).toBe(401);
    expect(await storedMessages(t)).toHaveLength(0);
  });
});

describe("filtering", () => {
  test("ignores events other than the transcription", async () => {
    const t = setup();
    const { callId } = await seedCall(t);

    const response = await postSigned(t, payload(callId, { type: "post_call_audio" }));

    expect(response.status).toBe(200);
    expect(await storedMessages(t)).toHaveLength(0);
    expect(await getCall(t, callId)).toMatchObject({ status: "active" });
  });

  test("ignores another agent's calls", async () => {
    const t = setup();
    const { callId } = await seedCall(t);

    const response = await postSigned(t, payload(callId, { agentId: "agent_other" }));

    expect(response.status).toBe(200);
    expect(await storedMessages(t)).toHaveLength(0);
    expect(await getCall(t, callId)).toMatchObject({ status: "active" });
  });

  test("ignores a call id it does not know", async () => {
    const t = setup();
    const { callId } = await seedCall(t);
    await t.run(async (ctx) => ctx.db.delete(callId));

    expect((await postSigned(t, payload(callId))).status).toBe(200);
    expect((await postSigned(t, payload("dashboard-test"))).status).toBe(200);
    expect(await storedMessages(t)).toHaveLength(0);
  });
});

describe("transcript", () => {
  test("writes each spoken turn into the call's conversation, in order, and settles the call", async () => {
    const t = setup();
    const { callId, conversationId } = await seedCall(t);

    await postSigned(t, payload(callId));

    const messages = (await storedMessages(t)).sort((a, b) => a.createdAt - b.createdAt);
    expect(messages.map((message) => message.conversationId)).toEqual([conversationId, conversationId, conversationId]);
    expect(messages.map((message) => message.uiMessageId)).toEqual([
      "voice-conv_1-0",
      "voice-conv_1-1",
      "voice-conv_1-4",
    ]);
    expect(messages.map((message) => message.role)).toEqual(["assistant", "user", "assistant"]);
    expect(messages.map((message) => message.createdAt)).toEqual([
      CONVERSATION_START,
      CONVERSATION_START + 4000,
      CONVERSATION_START + 9000,
    ]);
    expect(messages.map((message) => JSON.parse(message.metadataJson ?? "null"))).toEqual([
      { callId, channel: "voice" },
      { callId, channel: "voice" },
      { callId, channel: "voice" },
    ]);

    const parts = await t.run(async (ctx) => ctx.db.query("messageParts").collect());
    expect(parts.map((part) => part.textPreview).sort()).toEqual([
      "He works at Fyxer.",
      "Hi, I'm Poof. What would you like to know?",
      "Where does Lucien work?",
    ]);

    expect(await getCall(t, callId)).toMatchObject({
      durationSecs: 42,
      elevenConversationIds: ["conv_1"],
      status: "ended",
    });
    expect(await t.run(async (ctx) => ctx.db.get(conversationId))).toMatchObject({
      title: "Where does Lucien work?",
      updatedAt: NOW,
    });
  });

  test("a redelivered webhook adds nothing", async () => {
    const t = setup();
    const { callId } = await seedCall(t);

    await postSigned(t, payload(callId));
    const response = await postSigned(t, payload(callId, { transcript: [...TRANSCRIPT, TRANSCRIPT[1]!] }));

    expect(response.status).toBe(200);
    expect(await storedMessages(t)).toHaveLength(3);
    expect(await t.run(async (ctx) => ctx.db.query("messageParts").collect())).toHaveLength(3);
  });

  test("strips em-dashes and en-dashes the way the chat does", async () => {
    const t = setup();
    const { callId } = await seedCall(t);

    await postSigned(
      t,
      payload(callId, {
        transcript: [{ role: "agent", message: `Yes${EM_DASH}he did, 2020${EN_DASH}2024.`, time_in_call_secs: 1 }],
      }),
    );

    const parts = await t.run(async (ctx) => ctx.db.query("messageParts").collect());
    expect(parts.map((part) => JSON.parse(part.partJson))).toEqual([
      { text: "Yes - he did, 2020-2024.", type: "text" },
    ]);
  });

  test("keeps a title the conversation already has", async () => {
    const t = setup();
    const { callId, conversationId } = await seedCall(t);
    await t.run(async (ctx) => ctx.db.patch(conversationId, { title: "Earlier chat" }));

    await postSigned(t, payload(callId));

    expect(await storedMessages(t)).toHaveLength(3);
    expect(await t.run(async (ctx) => ctx.db.get(conversationId))).toMatchObject({ title: "Earlier chat" });
  });

  test("the chat reads the voice turns back with their metadata", async () => {
    const t = setup();
    const { callId, conversationId } = await seedCall(t);

    await postSigned(t, payload(callId));

    const result = await t.query(api.conversations.getConversationById, { conversationId, sessionId: SESSION });
    expect(result?.serializedMessages.map((message) => JSON.parse(message))).toEqual([
      {
        id: "voice-conv_1-0",
        metadata: { callId, channel: "voice" },
        parts: [{ text: "Hi, I'm Poof. What would you like to know?", type: "text" }],
        role: "assistant",
      },
      {
        id: "voice-conv_1-1",
        metadata: { callId, channel: "voice" },
        parts: [{ text: "Where does Lucien work?", type: "text" }],
        role: "user",
      },
      {
        id: "voice-conv_1-4",
        metadata: { callId, channel: "voice" },
        parts: [{ text: "He works at Fyxer.", type: "text" }],
        role: "assistant",
      },
    ]);
  });
});

describe("accounting", () => {
  test("settled time counts against the visitor's daily limit", async () => {
    const t = setup();
    const { callId } = await seedCall(t);

    await postSigned(t, payload(callId));

    expect(await getCall(t, callId)).toMatchObject({ durationSecs: 42, status: "ended" });
    const conversationId = await t.mutation(api.conversations.createConversation, { sessionId: SESSION });
    expect(
      await t.mutation(api.voiceCalls.reserveVoiceCall, {
        conversationId,
        ip: "1.1.1.1",
        serverSecret: SERVER_SECRET,
        sessionId: SESSION,
      }),
    ).toMatchObject({ allowed: true, maxSecs: 258 });
  });

  /* A released call can still have talked: ElevenLabs' own report wins. */
  test("overrides a release with the duration ElevenLabs reports", async () => {
    const t = setup();
    const { callId } = await seedCall(t);
    await t.mutation(api.voiceCalls.releaseVoiceCall, { callId, serverSecret: SERVER_SECRET, sessionId: SESSION });

    await postSigned(t, payload(callId));

    expect(await getCall(t, callId)).toMatchObject({ durationSecs: 42, status: "ended" });
  });

  test("a second ElevenLabs conversation on the same call adds its time and its transcript, once", async () => {
    const t = setup();
    const { callId } = await seedCall(t);
    const second = payload(callId, {
      conversationId: "conv_2",
      durationSecs: 30,
      transcript: [{ role: "user", message: "One more thing.", time_in_call_secs: 1 }],
    });

    await postSigned(t, payload(callId));
    await postSigned(t, second);
    await postSigned(t, payload(callId));
    await postSigned(t, second);

    expect(await getCall(t, callId)).toMatchObject({
      durationSecs: 72,
      elevenConversationIds: ["conv_1", "conv_2"],
      status: "ended",
    });
    expect((await storedMessages(t)).map((message) => message.uiMessageId).sort()).toEqual([
      "voice-conv_1-0",
      "voice-conv_1-1",
      "voice-conv_1-4",
      "voice-conv_2-0",
    ]);
  });

  test("ignores a conversation that started well before the call or after it went stale", async () => {
    const t = setup();
    const { callId } = await seedCall(t);
    const staleAtSecs = (STARTED_AT + 300_000 + 10 * MINUTE) / 1000;

    expect((await postSigned(t, payload(callId, { startTimeSecs: STARTED_AT / 1000 - 61 }))).status).toBe(200);
    expect((await postSigned(t, payload(callId, { startTimeSecs: staleAtSecs + 1 }))).status).toBe(200);

    expect(await storedMessages(t)).toHaveLength(0);
    expect(await getCall(t, callId)).toMatchObject({ status: "active" });
  });

  test("accepts a conversation that started up to a minute before the reservation", async () => {
    const t = setup();
    const { callId } = await seedCall(t);

    await postSigned(t, payload(callId, { startTimeSecs: STARTED_AT / 1000 - 59 }));

    expect(await getCall(t, callId)).toMatchObject({ durationSecs: 42, status: "ended" });
  });
});

describe("lenient parsing", () => {
  test("skips turns it cannot read and still writes the rest and settles", async () => {
    const t = setup();
    const { callId } = await seedCall(t);

    const response = await postSigned(
      t,
      payload(callId, {
        transcript: [
          { role: "tool", message: "lookup", time_in_call_secs: 1 },
          { role: "user", message: "No time on this one" },
          { role: "agent", message: 42, time_in_call_secs: 2 },
          "not a turn",
          { role: "user", message: "Still here?", time_in_call_secs: 3 },
        ],
      }),
    );

    expect(response.status).toBe(200);
    expect((await storedMessages(t)).map((message) => message.uiMessageId)).toEqual(["voice-conv_1-4"]);
    expect(await getCall(t, callId)).toMatchObject({ durationSecs: 42, status: "ended" });
  });

  test("settles the call even without a transcript", async () => {
    const t = setup();
    const { callId } = await seedCall(t);
    const body = JSON.parse(payload(callId));
    delete body.data.transcript;

    expect((await postSigned(t, JSON.stringify(body))).status).toBe(200);
    expect(await storedMessages(t)).toHaveLength(0);
    expect(await getCall(t, callId)).toMatchObject({ durationSecs: 42, status: "ended" });
  });

  test("refuses a transcription missing a field it needs to settle the call", async () => {
    const t = setup();
    const { callId } = await seedCall(t);
    const withoutDuration = JSON.parse(payload(callId));
    delete withoutDuration.data.metadata.call_duration_secs;
    const withoutConversation = JSON.parse(payload(callId));
    delete withoutConversation.data.conversation_id;
    const withoutCall = JSON.parse(payload(callId));
    delete withoutCall.data.conversation_initiation_client_data.dynamic_variables.call_id;

    for (const body of [withoutDuration, withoutConversation, withoutCall]) {
      expect((await postSigned(t, JSON.stringify(body))).status).toBe(400);
    }
    expect(await storedMessages(t)).toHaveLength(0);
    expect(await getCall(t, callId)).toMatchObject({ status: "active" });
  });
});
