/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { api } from "./_generated/api";
import schema from "./schema";
import { VOICE_LIMITS } from "./voiceLimits";

const modules = import.meta.glob(["./**/*.{ts,js}", "!./**/*.test.ts"]);

const NOW = Date.UTC(2026, 9, 15, 12, 0, 0);
const SECRET = "server-secret";

const fail = (t: ReturnType<typeof convexTest>, status: number, serverSecret = SECRET) =>
  t.mutation(api.voiceOutages.recordVoiceMintFailure, { serverSecret, status });
const resting = (t: ReturnType<typeof convexTest>) => t.query(api.voiceOutages.isVoiceResting, {});

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  vi.stubEnv("VOICE_SERVER_SECRET", SECRET);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("voice outage breaker", () => {
  test("opens on an account-level refusal, saying so only the first time", async () => {
    const t = convexTest(schema, modules);
    expect(await resting(t)).toBe(false);

    expect(await fail(t, 401)).toEqual({ opened: true });
    expect(await fail(t, 401)).toEqual({ opened: false });
    expect(await resting(t)).toBe(true);
  });

  test("stays shut on a server error at ElevenLabs, which is a one-off", async () => {
    const t = convexTest(schema, modules);

    expect(await fail(t, 503)).toEqual({ opened: false });
    expect(await resting(t)).toBe(false);
  });

  test("closes by itself once the outage window passes, and opens afresh after", async () => {
    const t = convexTest(schema, modules);
    await fail(t, 402);

    vi.setSystemTime(NOW + VOICE_LIMITS.outageSecs * 1000 + 1);
    expect(await resting(t)).toBe(false);
    expect(await fail(t, 402)).toEqual({ opened: true });
    expect(VOICE_LIMITS.outageSecs).toBe(60 * 60);
  });

  test("closes as soon as a call token is minted again", async () => {
    const t = convexTest(schema, modules);
    await fail(t, 401);

    await t.mutation(api.voiceOutages.clearVoiceOutage, { serverSecret: SECRET });

    expect(await resting(t)).toBe(false);
    expect(await fail(t, 401)).toEqual({ opened: true });
  });

  test("only the app server may open or close it", async () => {
    const t = convexTest(schema, modules);

    await expect(fail(t, 401, "guess")).rejects.toThrow(/Unauthorized/);
    await expect(t.mutation(api.voiceOutages.clearVoiceOutage, { serverSecret: "guess" })).rejects.toThrow(
      /Unauthorized/,
    );
    expect(await resting(t)).toBe(false);
  });
});
