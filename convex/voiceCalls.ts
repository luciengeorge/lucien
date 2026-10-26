import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";

import { internalMutation, mutation } from "./_generated/server";
import { rateLimiter } from "./rateLimits";
import { VOICE_LIMITS } from "./voiceLimits";

type Reservation =
  | { allowed: true; callId: Id<"voiceCalls">; maxSecs: number }
  | { allowed: false; reason: "call_active" | "global_limit" | "ip_limit" | "visitor_limit"; retryAfter?: number };

/**
 * Only the app server may spend voice time: the session id also reaches the browser, so it proves
 * nothing on its own. Refuses everything when the deployment has no VOICE_SERVER_SECRET.
 */
function assertServer(serverSecret: string) {
  const expected = process.env.VOICE_SERVER_SECRET;
  if (!expected || !constantTimeEqual(serverSecret, expected)) throw new Error("Unauthorized");
}

function constantTimeEqual(a: string, b: string) {
  let diff = a.length ^ b.length;
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    diff |= (a.charCodeAt(index) || 0) ^ (b.charCodeAt(index) || 0);
  }
  return diff === 0;
}

/**
 * Seconds a call holds against the limits. An active call holds the agent's whole call cap, since a
 * modified client can ignore a partial grant; it settles to its real duration when recordVoiceCallEnd
 * runs (from the post-call webhook).
 */
function secondsHeld(call: Doc<"voiceCalls">) {
  return call.status === "ended" ? (call.durationSecs ?? 0) : VOICE_LIMITS.callMaxSecs;
}

function staleAt(call: Doc<"voiceCalls">) {
  return call.startedAt + VOICE_LIMITS.callMaxSecs * 1000 + VOICE_LIMITS.staleAfterMs;
}

function sum(calls: Doc<"voiceCalls">[]) {
  return calls.reduce((total, call) => total + secondsHeld(call), 0);
}

export const reserveVoiceCall = mutation({
  args: { conversationId: v.id("conversations"), ip: v.string(), serverSecret: v.string(), sessionId: v.string() },
  handler: async (ctx, { conversationId, ip, serverSecret, sessionId }): Promise<Reservation> => {
    assertServer(serverSecret);
    const conversation = await ctx.db.get(conversationId);
    if (!conversation) throw new Error("Conversation not found");
    if (conversation.sessionId !== sessionId) throw new Error("Conversation access denied");

    const now = Date.now();
    const today = new Date(now);
    const dayStart = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    const nextDay = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1);
    const monthStart = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1);
    const nextMonth = Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1);

    // Reaches back far enough to see a live call that started before midnight.
    const oldestLiveStart = now - VOICE_LIMITS.callMaxSecs * 1000 - VOICE_LIMITS.staleAfterMs;
    const visitorCalls = await ctx.db
      .query("voiceCalls")
      .withIndex("by_session_id", (q) =>
        q.eq("sessionId", sessionId).gte("startedAt", Math.min(dayStart, oldestLiveStart)),
      )
      .collect();

    const liveCall = visitorCalls.find((call) => call.status === "active" && staleAt(call) > now);
    if (liveCall) return { allowed: false, reason: "call_active", retryAfter: staleAt(liveCall) - now };

    const visitorLeft = VOICE_LIMITS.visitorDailySecs - sum(visitorCalls.filter((call) => call.startedAt >= dayStart));
    if (visitorLeft < VOICE_LIMITS.minGrantSecs) {
      return { allowed: false, reason: "visitor_limit", retryAfter: nextDay - now };
    }

    const monthCalls = await ctx.db
      .query("voiceCalls")
      .withIndex("by_started_at", (q) => q.gte("startedAt", monthStart))
      .collect();
    const globalLeft = VOICE_LIMITS.globalMonthlySecs - sum(monthCalls);
    if (globalLeft < VOICE_LIMITS.minGrantSecs) {
      return { allowed: false, reason: "global_limit", retryAfter: nextMonth - now };
    }

    // Last, so a call refused for another reason does not spend the IP's allowance.
    const ipStatus = await rateLimiter.limit(ctx, "voiceIpDaily", { key: ip });
    if (!ipStatus.ok) return { allowed: false, reason: "ip_limit", retryAfter: ipStatus.retryAfter };

    const maxSecs = Math.floor(Math.min(visitorLeft, globalLeft));
    const callId = await ctx.db.insert("voiceCalls", {
      conversationId,
      ip,
      maxSecs,
      sessionId,
      startedAt: now,
      status: "active",
    });
    return { allowed: true, callId, maxSecs };
  },
});

/** Gives back a reservation no call came of, e.g. when the call token could not be minted. */
export const releaseVoiceCall = mutation({
  args: { callId: v.id("voiceCalls"), serverSecret: v.string(), sessionId: v.string() },
  handler: async (ctx, { callId, serverSecret, sessionId }) => {
    assertServer(serverSecret);
    const call = await ctx.db.get(callId);
    if (!call) throw new Error("Voice call not found");
    if (call.sessionId !== sessionId) throw new Error("Voice call access denied");
    if (call.status === "ended") return;
    await ctx.db.patch(callId, { durationSecs: 0, status: "ended" });
  },
});

/**
 * Records what a call really used, as ElevenLabs reports it. The first report wins, so a redelivered
 * webhook changes nothing, but it does override a release, since a released call may still have
 * connected. Returns false for an id that is not a known call.
 */
export const recordVoiceCallEnd = internalMutation({
  args: { callId: v.string(), durationSecs: v.number(), elevenConversationId: v.string() },
  handler: async (ctx, { callId, durationSecs, elevenConversationId }) => {
    const id = ctx.db.normalizeId("voiceCalls", callId);
    const call = id ? await ctx.db.get(id) : null;
    if (!call) return false;
    if (call.elevenConversationId !== undefined) return true;
    await ctx.db.patch(call._id, { durationSecs, elevenConversationId, status: "ended" });
    return true;
  },
});
