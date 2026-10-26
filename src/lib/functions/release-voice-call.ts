import { fetchAuthMutation } from "#/lib/auth-server";
import { getConversationSession } from "#/lib/conversation-session.server";
import { createLogger } from "#/lib/logger";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { z } from "zod";

import type { Id } from "../../../convex/_generated/dataModel";

import { api } from "../../../convex/_generated/api";

const logger = createLogger("voice.release-call");

const ReleaseVoiceCallSchema = z.object({ callId: z.string().min(1).max(64) });

const VoiceCallIdSchema = z.custom<Id<"voiceCalls">>((value) => typeof value === "string" && value.length > 0);

/**
 * Hands back a call the browser reserved but never connected. Convex decides whether it may: only
 * the cookie's own session, only while active, only just after reserving. Never throws, since it
 * runs while the visitor is already on their way back to the chat.
 */
export const releaseVoiceCallForRequest = createServerOnlyFn(
  async ({ callId }: z.infer<typeof ReleaseVoiceCallSchema>): Promise<null> => {
    const serverSecret = process.env.VOICE_SERVER_SECRET;
    const { sessionId } = (await getConversationSession()).data;
    if (!serverSecret || !sessionId) return null;
    try {
      await fetchAuthMutation(api.voiceCalls.releaseVoiceCall, {
        callId: VoiceCallIdSchema.parse(callId),
        serverSecret,
        sessionId,
      });
      logger.info("voice call released", { callId });
    } catch (error) {
      logger.warn("voice call release failed", { callId, error });
    }
    return null;
  },
);

export const releaseVoiceCall = createServerFn({ method: "POST" })
  .validator(ReleaseVoiceCallSchema)
  .handler(async ({ data }) => releaseVoiceCallForRequest(data));
