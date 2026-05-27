import type { UIMessage } from "ai";

import { z } from "zod";

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
