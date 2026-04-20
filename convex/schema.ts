import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  conversations: defineTable({
    createdAt: v.number(),
    sessionId: v.optional(v.string()),
    title: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_created_at", ["createdAt"])
    .index("by_session_id", ["sessionId"])
    .index("by_updated_at", ["updatedAt"]),
  messages: defineTable({
    conversationId: v.id("conversations"),
    createdAt: v.number(),
    metadataJson: v.optional(v.string()),
    modelId: v.optional(v.string()),
    provider: v.optional(v.string()),
    role: v.union(v.literal("assistant"), v.literal("system"), v.literal("user")),
    uiMessageId: v.string(),
  })
    .index("by_conversation_id", ["conversationId", "createdAt"])
    .index("by_conversation_and_ui_message_id", ["conversationId", "uiMessageId"])
    .index("by_created_at", ["createdAt"]),
  messageParts: defineTable({
    messageId: v.id("messages"),
    order: v.number(),
    partJson: v.string(),
    textPreview: v.optional(v.string()),
    toolCallId: v.optional(v.string()),
    toolName: v.optional(v.string()),
    toolState: v.optional(v.string()),
    type: v.string(),
  }).index("by_message_id", ["messageId", "order"]),
});
