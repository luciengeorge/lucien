import { v } from "convex/values";

import { internalMutation } from "./_generated/server";

export const backfillMessagePartConversationId = internalMutation({
  args: { cursor: v.union(v.string(), v.null()), numItems: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const pageSize = args.numItems ?? 100;
    const page = await ctx.db.query("messages").paginate({ cursor: args.cursor, numItems: pageSize });
    let updated = 0;
    for (const message of page.page) {
      const parts = await ctx.db
        .query("messageParts")
        .withIndex("by_message_id", (q) => q.eq("messageId", message._id))
        .collect();
      for (const part of parts) {
        if (part.conversationId === undefined) {
          await ctx.db.patch(part._id, { conversationId: message.conversationId });
          updated += 1;
        }
      }
    }
    return { updated, continueCursor: page.continueCursor, isDone: page.isDone };
  },
});
