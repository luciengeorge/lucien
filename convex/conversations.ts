import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";

import { mutation, query } from "./_generated/server";

type PersistedMessage = {
  createdAt?: number;
  id?: string;
  metadata?: unknown;
  modelId?: string;
  parts?: Array<Record<string, unknown>>;
  provider?: string;
  role: "assistant" | "system" | "user";
};

function toConversationId(value: string): Id<"conversations"> {
  return value as Id<"conversations">;
}

function serializeJson(value: unknown) {
  return JSON.stringify(value ?? null);
}

function deserializeJson<T>(value?: string): T | undefined {
  if (!value) return undefined;

  return JSON.parse(value) as T;
}

function deriveConversationTitle(messages: PersistedMessage[]) {
  const firstUserText = messages
    .filter((message) => message.role === "user")
    .map((message) => message.parts?.find((part) => part.type === "text" && typeof part.text === "string")?.text)
    .find((text) => typeof text === "string" && !text.startsWith("Introduce yourself first as Poof"));

  if (typeof firstUserText !== "string") {
    return undefined;
  }

  return firstUserText.slice(0, 120);
}

export const createConversation = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    const now = Date.now();

    return await ctx.db.insert("conversations", {
      createdAt: now,
      sessionId,
      updatedAt: now,
    });
  },
});

export const getConversationById = query({
  args: { conversationId: v.string() },
  handler: async (ctx, { conversationId }) => {
    const conversation = await ctx.db.get(toConversationId(conversationId));
    if (!conversation) return null;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_id", (q) => q.eq("conversationId", conversation._id))
      .collect();

    const hydratedMessages = await Promise.all(
      messages.map(async (message) => {
        const parts = await ctx.db
          .query("messageParts")
          .withIndex("by_message_id", (q) => q.eq("messageId", message._id))
          .collect();

        return {
          createdAt: message.createdAt,
          id: message.uiMessageId,
          metadata: deserializeJson<Record<string, {}>>(message.metadataJson) ?? null,
          modelId: message.modelId,
          parts: parts
            .map((part) => deserializeJson<Record<string, {}>>(part.partJson))
            .filter((part): part is Record<string, {}> => Boolean(part)),
          provider: message.provider,
          role: message.role,
        };
      }),
    );

    return {
      conversation: {
        createdAt: conversation.createdAt,
        id: conversation._id,
        sessionId: conversation.sessionId,
        title: conversation.title,
        updatedAt: conversation.updatedAt,
      },
      messages: hydratedMessages,
    };
  },
});

export const syncConversationMessages = mutation({
  args: {
    conversationId: v.string(),
    messagesJson: v.string(),
  },
  handler: async (ctx, { conversationId, messagesJson }) => {
    const conversationRecord = await ctx.db.get(toConversationId(conversationId));
    if (!conversationRecord) {
      throw new Error("Conversation not found");
    }

    const messages = JSON.parse(messagesJson) as PersistedMessage[];
    const existingMessages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_id", (q) => q.eq("conversationId", conversationRecord._id))
      .collect();

    for (const existingMessage of existingMessages) {
      const existingParts = await ctx.db
        .query("messageParts")
        .withIndex("by_message_id", (q) => q.eq("messageId", existingMessage._id))
        .collect();

      for (const part of existingParts) {
        await ctx.db.delete(part._id);
      }

      await ctx.db.delete(existingMessage._id);
    }

    for (const message of messages) {
      const createdAt = message.createdAt ?? Date.now();
      const insertedMessageId = await ctx.db.insert("messages", {
        conversationId: conversationRecord._id,
        createdAt,
        metadataJson: message.metadata ? serializeJson(message.metadata) : undefined,
        modelId: message.modelId,
        provider: message.provider,
        role: message.role,
        uiMessageId: message.id ?? crypto.randomUUID(),
      });

      for (const [order, part] of (message.parts ?? []).entries()) {
        const typedPart = part as {
          text?: string;
          toolCallId?: string;
          toolName?: string;
          state?: string;
          type?: string;
        };
        await ctx.db.insert("messageParts", {
          messageId: insertedMessageId,
          order,
          partJson: serializeJson(part),
          textPreview: typeof typedPart.text === "string" ? typedPart.text.slice(0, 160) : undefined,
          toolCallId: typedPart.toolCallId,
          toolName: typedPart.toolName,
          toolState: typedPart.state,
          type: typedPart.type ?? "unknown",
        });
      }
    }

    await ctx.db.patch(conversationRecord._id, {
      title: deriveConversationTitle(messages),
      updatedAt: Date.now(),
    });
  },
});
