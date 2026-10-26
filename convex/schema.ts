import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  /** Cached homepage intros, one per prompt version + content hash. The latest promoted is served. */
  intros: defineTable({
    key: v.string(),
    promotedAt: v.number(),
    text: v.string(),
  })
    .index("by_key", ["key"])
    .index("by_promoted_at", ["promotedAt"]),
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
    conversationId: v.optional(v.id("conversations")),
    messageId: v.id("messages"),
    order: v.number(),
    partJson: v.string(),
    textPreview: v.optional(v.string()),
    toolCallId: v.optional(v.string()),
    toolName: v.optional(v.string()),
    toolState: v.optional(v.string()),
    type: v.string(),
  })
    .index("by_message_id", ["messageId", "order"])
    .index("by_conversation", ["conversationId", "order"]),
  /** One row per voice call reservation; its seconds count against the limits in voiceLimits.ts. */
  voiceCalls: defineTable({
    conversationId: v.id("conversations"),
    durationSecs: v.optional(v.number()),
    /** ElevenLabs conversations already settled against this call, so a redelivery counts nothing twice. */
    elevenConversationIds: v.optional(v.array(v.string())),
    ip: v.string(),
    maxSecs: v.number(),
    sessionId: v.string(),
    startedAt: v.number(),
    status: v.union(v.literal("active"), v.literal("ended")),
  })
    .index("by_session_id", ["sessionId", "startedAt"])
    .index("by_started_at", ["startedAt"]),
});
