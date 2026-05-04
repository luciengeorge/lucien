import { v } from "convex/values";
import { z } from "zod";

import type { Id } from "./_generated/dataModel";

import { mutation, query } from "./_generated/server";

const SerializableValueSchema: z.ZodTypeAny = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(SerializableValueSchema),
    z.record(z.string(), SerializableValueSchema),
  ]),
);
const MessagePartShapeSchema = z
  .object({
    type: z.string(),
  })
  .catchall(SerializableValueSchema);
const PersistedMessageSchema = z.object({
  createdAt: z.number().optional(),
  id: z.string().optional(),
  metadata: z.record(z.string(), SerializableValueSchema).nullable().optional(),
  modelId: z.string().optional(),
  parts: z.array(MessagePartShapeSchema).optional(),
  provider: z.string().optional(),
  role: z.enum(["assistant", "system", "user"]),
});
const ConversationIdSchema = z.custom<Id<"conversations">>((value) => typeof value === "string" && value.length > 0);

type PersistedMessage = z.infer<typeof PersistedMessageSchema>;

function serializeJson(value: unknown) {
  return JSON.stringify(value ?? null);
}

function deserializeJson(value?: string): unknown {
  if (!value) return undefined;

  return JSON.parse(value);
}

function getPartText(part: Record<string, unknown>) {
  if (!("text" in part)) return undefined;
  return typeof part.text === "string" ? part.text : undefined;
}

function getPartToolCallId(part: Record<string, unknown>) {
  if (!("toolCallId" in part)) return undefined;
  return typeof part.toolCallId === "string" ? part.toolCallId : undefined;
}

function getPartToolName(part: Record<string, unknown>) {
  if (!("toolName" in part)) return undefined;
  return typeof part.toolName === "string" ? part.toolName : undefined;
}

function getPartState(part: Record<string, unknown>) {
  if (!("state" in part)) return undefined;
  return typeof part.state === "string" ? part.state : undefined;
}

function isLegacyIntroBootstrapMessage(role: string, parts: { type: string; text?: string }[] | undefined) {
  if (role !== "user") return false;
  const firstText = parts?.find((part) => part.type === "text");
  const text = firstText ? getPartText(firstText) : undefined;
  return typeof text === "string" && text.startsWith("Introduce yourself first as Poof");
}

function deriveConversationTitle(messages: PersistedMessage[]) {
  const firstUserText = messages
    .filter((message) => message.role === "user")
    .map((message) => message.parts?.find((part) => part.type === "text"))
    .map((part) => (part ? getPartText(part) : undefined))
    .find((text) => typeof text === "string" && !text.startsWith("Introduce yourself first as Poof"));

  if (typeof firstUserText !== "string") {
    return undefined;
  }

  return firstUserText.slice(0, 120);
}

function deriveConversationTitleFromMessage(message: PersistedMessage) {
  return deriveConversationTitle([message]);
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
  args: { conversationId: v.id("conversations"), sessionId: v.string() },
  handler: async (ctx, { conversationId, sessionId }) => {
    const conversation = await ctx.db.get(conversationId);
    if (!conversation) return null;
    if (conversation.sessionId !== sessionId) return null;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_id", (q) => q.eq("conversationId", conversation._id))
      .collect();

    const hydratedMessages = (
      await Promise.all(
        messages.map(async (message) => {
          const parts = await ctx.db
            .query("messageParts")
            .withIndex("by_message_id", (q) => q.eq("messageId", message._id))
            .collect();

          const parsedParts = parts
            .map((part) => MessagePartShapeSchema.safeParse(deserializeJson(part.partJson)).data)
            .filter(Boolean);

          if (isLegacyIntroBootstrapMessage(message.role, parsedParts as { type: string; text?: string }[])) {
            return null;
          }

          return serializeJson({
            id: message.uiMessageId,
            parts: parsedParts,
            role: message.role,
          });
        }),
      )
    ).filter((value): value is string => typeof value === "string");

    return {
      conversation: {
        createdAt: conversation.createdAt,
        id: conversation._id,
        sessionId: conversation.sessionId,
        title: conversation.title,
        updatedAt: conversation.updatedAt,
      },
      serializedMessages: hydratedMessages,
    };
  },
});

export const upsertConversationMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    messageJson: v.string(),
    sessionId: v.string(),
  },
  handler: async (ctx, { conversationId, messageJson, sessionId }) => {
    const conversationRecord = await ctx.db.get(ConversationIdSchema.parse(conversationId));
    if (!conversationRecord) {
      throw new Error("Conversation not found");
    }
    if (conversationRecord.sessionId !== sessionId) {
      throw new Error("Conversation access denied");
    }

    const message = PersistedMessageSchema.parse(JSON.parse(messageJson));
    const uiMessageId = message.id ?? crypto.randomUUID();
    const existingMessage = await ctx.db
      .query("messages")
      .withIndex("by_conversation_and_ui_message_id", (q) =>
        q.eq("conversationId", conversationRecord._id).eq("uiMessageId", uiMessageId),
      )
      .unique();

    const createdAt = message.createdAt ?? Date.now();

    if (existingMessage) {
      await ctx.db.patch(existingMessage._id, {
        createdAt,
        metadataJson: message.metadata ? serializeJson(message.metadata) : undefined,
        modelId: message.modelId,
        provider: message.provider,
        role: message.role,
      });

      const existingParts = await ctx.db
        .query("messageParts")
        .withIndex("by_message_id", (q) => q.eq("messageId", existingMessage._id))
        .collect();

      for (const part of existingParts) {
        await ctx.db.delete(part._id);
      }

      for (const [order, part] of (message.parts ?? []).entries()) {
        const parsedPart = MessagePartShapeSchema.parse(part);
        const textValue = getPartText(parsedPart);
        const toolCallId = getPartToolCallId(parsedPart);
        const toolName = getPartToolName(parsedPart);
        const toolState = getPartState(parsedPart);
        const partType = parsedPart.type;

        await ctx.db.insert("messageParts", {
          messageId: existingMessage._id,
          order,
          partJson: serializeJson(parsedPart),
          textPreview: textValue?.slice(0, 160),
          toolCallId,
          toolName,
          toolState,
          type: partType,
        });
      }
    } else {
      const insertedMessageId = await ctx.db.insert("messages", {
        conversationId: conversationRecord._id,
        createdAt,
        metadataJson: message.metadata ? serializeJson(message.metadata) : undefined,
        modelId: message.modelId,
        provider: message.provider,
        role: message.role,
        uiMessageId,
      });

      for (const [order, part] of (message.parts ?? []).entries()) {
        const parsedPart = MessagePartShapeSchema.parse(part);
        const textValue = getPartText(parsedPart);
        const toolCallId = getPartToolCallId(parsedPart);
        const toolName = getPartToolName(parsedPart);
        const toolState = getPartState(parsedPart);
        const partType = parsedPart.type;

        await ctx.db.insert("messageParts", {
          messageId: insertedMessageId,
          order,
          partJson: serializeJson(parsedPart),
          textPreview: textValue?.slice(0, 160),
          toolCallId,
          toolName,
          toolState,
          type: partType,
        });
      }
    }

    const nextTitle = conversationRecord.title ?? deriveConversationTitleFromMessage(message);
    await ctx.db.patch(conversationRecord._id, {
      title: nextTitle,
      updatedAt: Date.now(),
    });
  },
});
