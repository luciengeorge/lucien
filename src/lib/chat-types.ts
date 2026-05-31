import type { UIMessage } from "ai";

import { z } from "zod";

import type { Id } from "../../convex/_generated/dataModel";

export const UIMessagePartSchema = z
  .object({
    type: z.string(),
  })
  .catchall(z.any());

const StoredUIMessageShapeSchema = z.object({
  id: z.string().min(1),
  parts: z.array(UIMessagePartSchema),
  role: z.enum(["assistant", "system", "user"]),
});

export const StoredUIMessageSchema = z.custom<UIMessage>(
  (value) => StoredUIMessageShapeSchema.safeParse(value).success,
);

export const StoredUIMessagesSchema = z.array(StoredUIMessageSchema);

export const ChatConversationStateSchema = z.object({
  conversation: z
    .object({
      createdAt: z.number(),
      id: z.string(),
      sessionId: z.string().optional(),
      title: z.string().optional(),
      updatedAt: z.number(),
    })
    .nullable(),
  serializedMessages: z.array(z.string()),
});

export type ChatConversationState = z.infer<typeof ChatConversationStateSchema>;

export function parseSerializedMessages(serializedMessages: string[]): UIMessage[] {
  return StoredUIMessagesSchema.parse(serializedMessages.map((message) => JSON.parse(message)));
}

const BasicUIMessageSchema = z.object({
  id: z.string().min(1),
  parts: z.array(z.record(z.string(), z.unknown())),
  role: z.enum(["assistant", "system", "user"]),
});

const ConversationIdSchema = z.custom<Id<"conversations">>((value) => typeof value === "string" && value.length > 0);

export const ChatRequestSchema = z.object({
  id: ConversationIdSchema,
  message: z.custom<UIMessage>((value) => BasicUIMessageSchema.safeParse(value).success),
});

export function getTextFromMessage(message: UIMessage | undefined): string {
  if (!message) return "";

  return message.parts.reduce<string>((text, part) => {
    if (part.type !== "text") return text;
    if (typeof part.text !== "string") return text;
    return `${text} ${part.text}`.trim();
  }, "");
}
