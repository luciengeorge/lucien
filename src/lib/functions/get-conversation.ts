import type { ChatConversationState } from "#/lib/chat-types";

import { fetchAuthQuery } from "#/lib/auth-server";
import { ConversationIdSchema } from "#/lib/chat-types";
import { getConversationSession } from "#/lib/conversation-session.server";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { z } from "zod";

import { api } from "../../../convex/_generated/api";

const GetConversationSchema = z.object({ conversationId: z.string().min(1).max(64) });

/**
 * One conversation, read-only, for the session in the cookie: Convex returns null for anyone else's.
 * Unlike resumeOrStartConversation it never creates one, so polling it cannot move the visitor on.
 */
export const getConversationForRequest = createServerOnlyFn(
  async ({ conversationId }: z.infer<typeof GetConversationSchema>): Promise<ChatConversationState | null> => {
    const { sessionId } = (await getConversationSession()).data;
    if (!sessionId) return null;
    return fetchAuthQuery(api.conversations.getConversationById, {
      conversationId: ConversationIdSchema.parse(conversationId),
      sessionId,
    });
  },
);

export const getConversation = createServerFn({ method: "POST" })
  .validator(GetConversationSchema)
  .handler(async ({ data }) => getConversationForRequest(data));
