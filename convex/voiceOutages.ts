import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { assertServer } from "./voiceCalls";
import { isAccountRefusal, VOICE_LIMITS } from "./voiceLimits";

/** Public and secret-free: whether voice is resting reveals nothing, and the page needs it to grey the button. */
export const isVoiceResting = query({
  args: {},
  handler: async (ctx): Promise<boolean> => {
    const outage = await ctx.db.query("voiceOutages").first();
    return outage !== null && outage.until > Date.now();
  },
});

/** `opened` only when this refusal started the outage, so the alert goes out once. */
export const recordVoiceMintFailure = mutation({
  args: { serverSecret: v.string(), status: v.number() },
  handler: async (ctx, { serverSecret, status }): Promise<{ opened: boolean }> => {
    assertServer(serverSecret);
    if (!isAccountRefusal(status)) return { opened: false };

    const now = Date.now();
    const until = now + VOICE_LIMITS.outageSecs * 1000;
    const outage = await ctx.db.query("voiceOutages").first();
    if (!outage) {
      await ctx.db.insert("voiceOutages", { openedAt: now, status, until });
      return { opened: true };
    }
    const opened = outage.until <= now;
    await ctx.db.patch(outage._id, { openedAt: opened ? now : outage.openedAt, status, until });
    return { opened };
  },
});

export const clearVoiceOutage = mutation({
  args: { serverSecret: v.string() },
  handler: async (ctx, { serverSecret }) => {
    assertServer(serverSecret);
    const outage = await ctx.db.query("voiceOutages").first();
    if (outage) await ctx.db.delete(outage._id);
  },
});
