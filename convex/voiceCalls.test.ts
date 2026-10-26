/// <reference types="vite/client" />

import rateLimiter from "@convex-dev/rate-limiter/test";
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type { Id } from "./_generated/dataModel";

import { api } from "./_generated/api";
import schema from "./schema";
import { VOICE_LIMITS } from "./voiceLimits";

const modules = import.meta.glob(["./**/*.{ts,js}", "!./**/*.test.ts"]);

const NOW = Date.UTC(2026, 9, 15, 12, 0, 0);
const MINUTE = 60_000;
const SESSION = "session-a";
const SECRET = "server-secret";

function setup() {
  const t = convexTest(schema, modules);
  rateLimiter.register(t);
  return t;
}

type T = ReturnType<typeof setup>;

async function createConversation(t: T, sessionId = SESSION) {
  return await t.mutation(api.conversations.createConversation, { sessionId });
}

async function seedCall(
  t: T,
  call: { sessionId?: string; startedAt: number; maxSecs: number; status: "active" | "ended"; durationSecs?: number },
) {
  const sessionId = call.sessionId ?? SESSION;
  const conversationId = await createConversation(t, sessionId);
  return await t.run(async (ctx) => ctx.db.insert("voiceCalls", { ...call, conversationId, ip: "seed", sessionId }));
}

async function reserve(t: T, { sessionId = SESSION, ip = "1.1.1.1" } = {}) {
  const conversationId = await createConversation(t, sessionId);
  return await t.mutation(api.voiceCalls.reserveVoiceCall, { conversationId, ip, serverSecret: SECRET, sessionId });
}

async function callCount(t: T) {
  return (await t.run(async (ctx) => ctx.db.query("voiceCalls").collect())).length;
}

async function getCall(t: T, callId: Id<"voiceCalls">) {
  return await t.run(async (ctx) => ctx.db.get(callId));
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  vi.stubEnv("VOICE_SERVER_SECRET", SECRET);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

/* The session id reaches the browser, so only the app server, holding the secret, may spend voice time. */
describe("server secret", () => {
  test("refuses a reservation with the wrong secret, changing nothing", async () => {
    const t = setup();
    const conversationId = await createConversation(t);

    await expect(
      t.mutation(api.voiceCalls.reserveVoiceCall, {
        conversationId,
        ip: "1.1.1.1",
        serverSecret: "guess",
        sessionId: SESSION,
      }),
    ).rejects.toThrow(/Unauthorized/);
    expect(await callCount(t)).toBe(0);
  });

  test("refuses every reservation when the deployment has no secret set", async () => {
    vi.stubEnv("VOICE_SERVER_SECRET", "");
    const t = setup();
    const conversationId = await createConversation(t);

    await expect(
      t.mutation(api.voiceCalls.reserveVoiceCall, {
        conversationId,
        ip: "1.1.1.1",
        serverSecret: "",
        sessionId: SESSION,
      }),
    ).rejects.toThrow(/Unauthorized/);
    expect(await callCount(t)).toBe(0);
  });

  test("a refused caller does not spend the IP's allowance", async () => {
    const t = setup();
    for (let index = 0; index < 6; index += 1) {
      const conversationId = await createConversation(t, `attacker-${index}`);
      await expect(
        t.mutation(api.voiceCalls.reserveVoiceCall, {
          conversationId,
          ip: "1.1.1.1",
          serverSecret: "guess",
          sessionId: `attacker-${index}`,
        }),
      ).rejects.toThrow(/Unauthorized/);
    }

    expect(await reserve(t)).toMatchObject({ allowed: true });
  });

  test("refuses a release with the wrong secret, leaving the call active", async () => {
    const t = setup();
    const callId = await seedCall(t, { maxSecs: 300, startedAt: NOW, status: "active" });

    await expect(
      t.mutation(api.voiceCalls.releaseVoiceCall, { callId, serverSecret: "guess", sessionId: SESSION }),
    ).rejects.toThrow(/Unauthorized/);
    expect(await getCall(t, callId)).toMatchObject({ status: "active" });
  });
});

describe("reserveVoiceCall", () => {
  test("grants a fresh visitor a full five minute call and records it as active", async () => {
    const t = setup();
    const conversationId = await createConversation(t);

    const result = await t.mutation(api.voiceCalls.reserveVoiceCall, {
      conversationId,
      ip: "1.1.1.1",
      serverSecret: SECRET,
      sessionId: SESSION,
    });

    expect(result).toEqual({ allowed: true, callId: expect.any(String), maxSecs: 300 });
    if (!result.allowed) throw new Error("expected a call");
    expect(await getCall(t, result.callId)).toMatchObject({
      conversationId,
      ip: "1.1.1.1",
      maxSecs: 300,
      sessionId: SESSION,
      startedAt: NOW,
      status: "active",
    });
  });

  test("refuses a conversation that belongs to another session", async () => {
    const t = setup();
    const conversationId = await createConversation(t, "session-b");

    await expect(
      t.mutation(api.voiceCalls.reserveVoiceCall, {
        conversationId,
        ip: "1.1.1.1",
        serverSecret: SECRET,
        sessionId: SESSION,
      }),
    ).rejects.toThrow(/access denied/);
  });

  test("refuses a conversation that does not exist", async () => {
    const t = setup();
    const conversationId = await createConversation(t);
    await t.run(async (ctx) => ctx.db.delete(conversationId));

    await expect(
      t.mutation(api.voiceCalls.reserveVoiceCall, {
        conversationId,
        ip: "1.1.1.1",
        serverSecret: SECRET,
        sessionId: SESSION,
      }),
    ).rejects.toThrow(/not found/);
  });

  describe("visitor limit", () => {
    test("grants what is left of the visitor's five minutes today", async () => {
      const t = setup();
      await seedCall(t, { durationSecs: 200, maxSecs: 300, startedAt: NOW - 60 * MINUTE, status: "ended" });

      expect(await reserve(t)).toMatchObject({ allowed: true, maxSecs: 100 });
    });

    test("refuses when less than 30 seconds are left, until midnight UTC", async () => {
      const t = setup();
      await seedCall(t, { durationSecs: 280, maxSecs: 300, startedAt: NOW - 60 * MINUTE, status: "ended" });

      expect(await reserve(t)).toEqual({
        allowed: false,
        reason: "visitor_limit",
        retryAfter: Date.UTC(2026, 9, 16) - NOW,
      });
    });

    test("starts afresh at midnight UTC", async () => {
      const t = setup();
      await seedCall(t, { durationSecs: 300, maxSecs: 300, startedAt: Date.UTC(2026, 9, 14, 23, 59), status: "ended" });

      expect(await reserve(t)).toMatchObject({ allowed: true, maxSecs: 300 });
    });

    test("only counts the visitor's own calls", async () => {
      const t = setup();
      await seedCall(t, {
        durationSecs: 300,
        maxSecs: 300,
        sessionId: "session-b",
        startedAt: NOW - 60 * MINUTE,
        status: "ended",
      });

      expect(await reserve(t)).toMatchObject({ allowed: true, maxSecs: 300 });
    });
  });

  describe("active calls", () => {
    test("allows one live call per visitor at a time", async () => {
      const t = setup();
      await seedCall(t, { maxSecs: 60, startedAt: NOW - MINUTE, status: "active" });

      // The agent lets any call run its full five minutes, whatever was granted.
      expect(await reserve(t)).toEqual({
        allowed: false,
        reason: "call_active",
        retryAfter: 5 * MINUTE + 10 * MINUTE - MINUTE,
      });
    });

    test("a call that never reported its end stops blocking, but counts in full", async () => {
      const t = setup();
      await seedCall(t, { maxSecs: 60, startedAt: NOW - 16 * MINUTE, status: "active" });

      expect(await reserve(t)).toMatchObject({ allowed: false, reason: "visitor_limit" });
    });

    test("an unsettled call from yesterday does not block today", async () => {
      vi.setSystemTime(Date.UTC(2026, 9, 16, 0, 10));
      const t = setup();
      await seedCall(t, { maxSecs: 300, startedAt: Date.UTC(2026, 9, 15, 23, 50), status: "active" });

      expect(await reserve(t)).toMatchObject({ allowed: true, maxSecs: 300 });
    });

    /* A modified client can ignore a partial grant, so until a call settles it holds all it could use. */
    test("an active call holds the agent's whole call cap against the limits", async () => {
      const t = setup();
      await seedCall(t, { maxSecs: 60, sessionId: "session-b", startedAt: NOW - 2 * MINUTE, status: "active" });
      await seedCall(t, {
        maxSecs: 300,
        sessionId: "session-c",
        startedAt: NOW - 60 * MINUTE,
        status: "ended",
        durationSecs: 4170,
      });

      expect(await reserve(t)).toMatchObject({ allowed: true, maxSecs: 30 });
    });
  });

  describe("global limit", () => {
    test("grants no more than is left of the month's budget", async () => {
      const t = setup();
      await seedCall(t, {
        durationSecs: 4400,
        maxSecs: 300,
        sessionId: "others",
        startedAt: Date.UTC(2026, 9, 2),
        status: "ended",
      });

      expect(await reserve(t)).toMatchObject({ allowed: true, maxSecs: 100 });
    });

    test("refuses when the month's budget is spent, until the next month UTC", async () => {
      const t = setup();
      await seedCall(t, {
        durationSecs: 4480,
        maxSecs: 300,
        sessionId: "others",
        startedAt: Date.UTC(2026, 9, 2),
        status: "ended",
      });

      expect(await reserve(t)).toEqual({
        allowed: false,
        reason: "global_limit",
        retryAfter: Date.UTC(2026, 10, 1) - NOW,
      });
    });

    test("starts afresh on the first of the month UTC", async () => {
      const t = setup();
      await seedCall(t, {
        durationSecs: 4500,
        maxSecs: 300,
        sessionId: "others",
        startedAt: Date.UTC(2026, 8, 30, 23, 59),
        status: "ended",
      });

      expect(await reserve(t)).toMatchObject({ allowed: true, maxSecs: 300 });
    });
  });

  describe("ip limit", () => {
    /* Session ids are free to mint, so the IP is the real ceiling. */
    test("allows six calls a day from one IP, whatever the session", async () => {
      const t = setup();
      for (let index = 0; index < 6; index += 1) {
        expect(await reserve(t, { sessionId: `session-${index}` })).toMatchObject({ allowed: true });
      }

      expect(await reserve(t, { sessionId: "session-6" })).toEqual({
        allowed: false,
        reason: "ip_limit",
        retryAfter: expect.any(Number),
      });
      expect(await reserve(t, { ip: "2.2.2.2", sessionId: "session-7" })).toMatchObject({ allowed: true });
    });

    test("a refused call does not use up the IP's allowance", async () => {
      const t = setup();
      await seedCall(t, { durationSecs: 300, maxSecs: 300, startedAt: NOW - MINUTE, status: "ended" });
      for (let index = 0; index < 6; index += 1) {
        expect(await reserve(t)).toMatchObject({ reason: "visitor_limit" });
      }

      expect(await reserve(t, { sessionId: "session-b" })).toMatchObject({ allowed: true });
    });
  });
});

describe("releaseVoiceCall", () => {
  test("ends the visitor's active call with nothing used", async () => {
    const t = setup();
    const callId = await seedCall(t, { maxSecs: 300, startedAt: NOW, status: "active" });

    await t.mutation(api.voiceCalls.releaseVoiceCall, { callId, serverSecret: SECRET, sessionId: SESSION });

    expect(await getCall(t, callId)).toMatchObject({ durationSecs: 0, status: "ended" });
    expect(await reserve(t)).toMatchObject({ allowed: true, maxSecs: 300 });
  });

  test("cannot touch another visitor's call", async () => {
    const t = setup();
    const callId = await seedCall(t, { maxSecs: 300, startedAt: NOW, status: "active" });

    await t.mutation(api.voiceCalls.releaseVoiceCall, { callId, serverSecret: SECRET, sessionId: "session-b" });

    expect(await getCall(t, callId)).toMatchObject({ status: "active" });
  });

  /* The session id reaches the browser, so a release must not be a way to talk for free. */
  test("only gives back a call reserved moments ago, which cannot have run long", async () => {
    const t = setup();
    const fresh = await seedCall(t, {
      maxSecs: 300,
      startedAt: NOW - (VOICE_LIMITS.releaseWindowSecs - 1) * 1000,
      status: "active",
    });
    const old = await seedCall(t, {
      maxSecs: 300,
      startedAt: NOW - (VOICE_LIMITS.releaseWindowSecs + 1) * 1000,
      status: "active",
    });

    await t.mutation(api.voiceCalls.releaseVoiceCall, { callId: fresh, serverSecret: SECRET, sessionId: SESSION });
    await t.mutation(api.voiceCalls.releaseVoiceCall, { callId: old, serverSecret: SECRET, sessionId: SESSION });

    expect(await getCall(t, fresh)).toMatchObject({ durationSecs: 0, status: "ended" });
    expect(await getCall(t, old)).toMatchObject({ status: "active" });
    expect(VOICE_LIMITS.releaseWindowSecs).toBe(90);
  });

  test("leaves a call that already ended as it was", async () => {
    const t = setup();
    const callId = await seedCall(t, { durationSecs: 120, maxSecs: 300, startedAt: NOW, status: "ended" });

    await t.mutation(api.voiceCalls.releaseVoiceCall, { callId, serverSecret: SECRET, sessionId: SESSION });

    expect(await getCall(t, callId)).toMatchObject({ durationSecs: 120, status: "ended" });
  });
});

describe("allowVoiceContact", () => {
  const ask = (t: T, { ip = "1.1.1.1", sessionId = SESSION, serverSecret = SECRET } = {}) =>
    t.mutation(api.voiceCalls.allowVoiceContact, { ip, serverSecret, sessionId });

  test("lets a visitor who just had a call write to Lucien", async () => {
    const t = setup();
    await seedCall(t, { maxSecs: 300, startedAt: NOW - 5 * MINUTE, status: "ended", durationSecs: 60 });

    expect(await ask(t)).toEqual({ allowed: true });
  });

  /* The form only ever opens from a call, so without one the request is not the form. */
  test("refuses a session with no call in the last few minutes", async () => {
    const t = setup();
    await seedCall(t, {
      maxSecs: 300,
      startedAt: NOW - (VOICE_LIMITS.contactAfterCallSecs * 1000 + MINUTE),
      status: "ended",
      durationSecs: 60,
    });
    await seedCall(t, { maxSecs: 300, sessionId: "session-b", startedAt: NOW, status: "active" });

    expect(await ask(t)).toEqual({ allowed: false });
  });

  test("allows a few messages a day per session", async () => {
    const t = setup();
    await seedCall(t, { maxSecs: 300, startedAt: NOW, status: "active" });

    for (let index = 0; index < VOICE_LIMITS.contactDailyMessages; index++) {
      expect(await ask(t, { ip: `9.9.9.${index}` })).toEqual({ allowed: true });
    }
    expect(await ask(t, { ip: "9.9.9.99" })).toEqual({ allowed: false });
  });

  test("allows a few messages a day per IP, whatever the session", async () => {
    const t = setup();
    for (let index = 0; index <= VOICE_LIMITS.contactDailyMessages; index++) {
      await seedCall(t, { maxSecs: 300, sessionId: `session-${index}`, startedAt: NOW, status: "active" });
    }

    for (let index = 0; index < VOICE_LIMITS.contactDailyMessages; index++) {
      expect(await ask(t, { sessionId: `session-${index}` })).toEqual({ allowed: true });
    }
    expect(await ask(t, { sessionId: `session-${VOICE_LIMITS.contactDailyMessages}` })).toEqual({ allowed: false });
    expect(VOICE_LIMITS.contactDailyMessages).toBe(3);
  });

  test("refuses without the server secret", async () => {
    const t = setup();
    await seedCall(t, { maxSecs: 300, startedAt: NOW, status: "active" });

    await expect(ask(t, { serverSecret: "guess" })).rejects.toThrow(/Unauthorized/);
  });
});
