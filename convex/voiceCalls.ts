import { type ObjectType, v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";

import { internalMutation, mutation, type MutationCtx } from "./_generated/server";
import { deriveConversationTitle, type PersistedMessage, storeMessage } from "./conversations";
import { rateLimiter } from "./rateLimits";
import { stripDashes } from "./stripDashes";
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
 * modified client can ignore a partial grant; it settles to its real duration when recordVoiceTranscript
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

/**
 * Gives back a reservation no call came of: the token could not be minted, or the browser never
 * connected. Only the visitor's own active call, and only within `releaseWindowSecs` of reserving
 * it, so a release sent mid-call refunds a few seconds at most; anything else is a no-op. A call
 * that did connect is settled to its real duration by the webhook, which overrides a release.
 */
export const releaseVoiceCall = mutation({
  args: { callId: v.id("voiceCalls"), serverSecret: v.string(), sessionId: v.string() },
  handler: async (ctx, { callId, serverSecret, sessionId }) => {
    assertServer(serverSecret);
    const call = await ctx.db.get(callId);
    if (!call || call.sessionId !== sessionId || call.status !== "active") return;
    if (Date.now() - call.startedAt > VOICE_LIMITS.releaseWindowSecs * 1000) return;
    await ctx.db.patch(callId, { durationSecs: 0, status: "ended" });
  },
});

/**
 * Whether the voice contact form may post to Slack: it posts without the model in between, so it
 * only sends for a session that just had a call, a few times a day per session and per IP.
 */
export const allowVoiceContact = mutation({
  args: { ip: v.string(), serverSecret: v.string(), sessionId: v.string() },
  handler: async (ctx, { ip, serverSecret, sessionId }): Promise<{ allowed: boolean }> => {
    assertServer(serverSecret);
    const recentCall = await ctx.db
      .query("voiceCalls")
      .withIndex("by_session_id", (q) =>
        q.eq("sessionId", sessionId).gte("startedAt", Date.now() - VOICE_LIMITS.contactAfterCallSecs * 1000),
      )
      .first();
    if (!recentCall) return { allowed: false };

    const ipStatus = await rateLimiter.limit(ctx, "contactIpDaily", { key: ip });
    if (!ipStatus.ok) return { allowed: false };
    const sessionStatus = await rateLimiter.limit(ctx, "contactSessionDaily", { key: sessionId });
    return { allowed: sessionStatus.ok };
  },
});

const transcriptArgs = {
  callId: v.string(),
  conversationStartedAtSecs: v.optional(v.number()),
  durationSecs: v.number(),
  elevenConversationId: v.string(),
  transcript: v.array(
    v.object({
      index: v.number(),
      message: v.union(v.string(), v.null()),
      role: v.union(v.literal("agent"), v.literal("user")),
      timeInCallSecs: v.number(),
    }),
  ),
};

/**
 * Puts what was said on a call into the visitor's chat and settles the call. Each ElevenLabs
 * conversation counts once, so a redelivery, or the webhook and the app's own settle both landing,
 * changes nothing; its reported time replaces a release, since a released call may still have
 * connected. True once the call holds this conversation, whether now or before.
 */
async function recordTranscript(
  ctx: MutationCtx,
  call: Doc<"voiceCalls">,
  { conversationStartedAtSecs, durationSecs, elevenConversationId, transcript }: ObjectType<typeof transcriptArgs>,
) {
  const settled = call.elevenConversationIds ?? [];
  if (settled.includes(elevenConversationId)) return true;

  const conversationStartedAt =
    conversationStartedAtSecs === undefined ? call.startedAt : conversationStartedAtSecs * 1000;
  if (conversationStartedAt < call.startedAt - 60_000 || conversationStartedAt > staleAt(call)) {
    console.warn(`Voice transcript ${elevenConversationId} started outside call ${call._id}`);
    return false;
  }

  const conversation = await ctx.db.get(call.conversationId);
  if (conversation) {
    const messages: PersistedMessage[] = transcript.flatMap((turn) => {
      const text = stripDashes(turn.message ?? "").trim();
      if (!text) return [];
      return {
        createdAt: conversationStartedAt + turn.timeInCallSecs * 1000,
        id: `voice-${elevenConversationId}-${turn.index}`,
        metadata: { callId: call._id, channel: "voice" },
        parts: [{ text, type: "text" }],
        role: turn.role === "agent" ? "assistant" : "user",
      };
    });
    for (const message of messages) {
      await storeMessage(ctx, conversation, message);
    }
    await ctx.db.patch(conversation._id, {
      title: conversation.title ?? deriveConversationTitle(messages),
      updatedAt: Date.now(),
    });
  }

  await ctx.db.patch(call._id, {
    durationSecs: (settled.length > 0 ? (call.durationSecs ?? 0) : 0) + durationSecs,
    elevenConversationIds: [...settled, elevenConversationId],
    status: "ended",
  });
  return true;
}

/** From ElevenLabs' post-call webhook, signed by ElevenLabs. */
export const recordVoiceTranscript = internalMutation({
  args: transcriptArgs,
  handler: async (ctx, args) => {
    const id = ctx.db.normalizeId("voiceCalls", args.callId);
    const call = id ? await ctx.db.get(id) : null;
    if (!call) {
      console.warn(`Voice transcript for unknown call ${args.callId} (${args.elevenConversationId})`);
      return;
    }
    await recordTranscript(ctx, call, args);
  },
});

/**
 * The app server settling a call it just watched end, from ElevenLabs' conversations API: the
 * webhook can be slow, fail, or (in dev) go to another deployment, and until a call settles it
 * blocks the visitor's next one. Only the cookie's own session's call.
 */
export const settleVoiceCall = mutation({
  args: { ...transcriptArgs, serverSecret: v.string(), sessionId: v.string() },
  handler: async (ctx, { serverSecret, sessionId, ...args }): Promise<{ settled: boolean }> => {
    assertServer(serverSecret);
    const id = ctx.db.normalizeId("voiceCalls", args.callId);
    const call = id ? await ctx.db.get(id) : null;
    if (!call || call.sessionId !== sessionId) return { settled: false };
    return { settled: await recordTranscript(ctx, call, args) };
  },
});
