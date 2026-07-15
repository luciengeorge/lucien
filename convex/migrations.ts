import { internalMutation } from "./_generated/server";

export const backfillMessagePartConversationId = internalMutation({
  args: {},
  handler: async (ctx) => {
    const messages = await ctx.db.query("messages").collect();
    let updated = 0;
    for (const message of messages) {
      const parts = await ctx.db
        .query("messageParts")
        .withIndex("by_message_id", (q) => q.eq("messageId", message._id))
        .collect();
      for (const part of parts) {
        await ctx.db.patch(part._id, { conversationId: message.conversationId });
        updated += 1;
      }
    }
    return { updated };
  },
});
