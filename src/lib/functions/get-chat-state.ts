import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { Id } from "../../../convex/_generated/dataModel";
import type { ChatConversationState } from "../chat-types";

import { api } from "../../../convex/_generated/api";
import { fetchAuthMutation, fetchAuthQuery } from "../auth-server";
import { buildIntroForConversation } from "../conversation-intro.server";
import { getConversationSession } from "../conversation-session.server";
import { createLogger } from "../logger";

const logger = createLogger("conversation.get-state");
const ConversationIdSchema = z.custom<Id<"conversations">>((value) => typeof value === "string" && value.length > 0);

type ConversationMeta = NonNullable<ChatConversationState["conversation"]>;

export type EnsureChatConversationResult =
  | { kind: "resumed"; state: ChatConversationState }
  | { kind: "new"; sessionId: string; conversation: ConversationMeta };

/**
 * Cookie-critical, blocking step. Resolves the active conversation for the
 * current session, creating one if needed, and writes the session cookie
 * (conversationId + sessionId) into the SSR response headers. Returning
 * visitors are resumed here (one cheap query); new visitors only pay a single
 * create mutation — the intro generation is deferred (see getChatIntro).
 */
export const ensureChatConversation = createServerFn({ method: "GET" }).handler(
  async (): Promise<EnsureChatConversationResult> => {
    const session = await getConversationSession();
    const sessionId = session.data.sessionId ?? crypto.randomUUID();

    if (!session.data.sessionId) {
      await session.update({ ...session.data, sessionId });
    }

    const existingId = session.data.conversationId;
    if (existingId) {
      const existing = await fetchAuthQuery(api.conversations.getConversationById, {
        conversationId: ConversationIdSchema.parse(existingId),
        sessionId,
      });

      if (existing) {
        logger.info("conversation resumed", {
          conversationId: existingId,
          messageCount: existing.serializedMessages.length,
        });
        return { kind: "resumed", state: existing };
      }
    }

    const conversationId = await fetchAuthMutation(api.conversations.createConversation, { sessionId });
    await session.update({ ...session.data, conversationId, sessionId });

    logger.info("conversation created (intro deferred)", { conversationId });

    const now = Date.now();
    return {
      kind: "new",
      sessionId,
      conversation: { id: conversationId, createdAt: now, sessionId, updatedAt: now },
    };
  },
);

const ChatIntroArgsSchema = z.object({
  conversationId: z.string().min(1),
  sessionId: z.string().min(1),
});

/**
 * Deferred, non-cookie step. Generates + persists the (cached LLM) intro for a
 * freshly created conversation. Streamed via <Await> so it never blocks first
 * paint or TTFB.
 */
export const getChatIntro = createServerFn({ method: "GET" })
  .inputValidator(ChatIntroArgsSchema)
  .handler(async ({ data }): Promise<ChatConversationState> => {
    const { serializedMessages } = await buildIntroForConversation(data.conversationId, data.sessionId);
    const now = Date.now();

    return {
      conversation: { id: data.conversationId, createdAt: now, sessionId: data.sessionId, updatedAt: now },
      serializedMessages,
    };
  });
