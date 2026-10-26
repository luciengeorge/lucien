import { fetchAuthMutation } from "#/lib/auth-server";
import { getConversationSession } from "#/lib/conversation-session.server";
import { createLogger } from "#/lib/logger";
import { VOICE_AGENT_ID } from "#/lib/voice/agent-config";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { z } from "zod";

import { api } from "../../../convex/_generated/api";
import { ElevenConversationSchema, toVoiceTranscriptArgs } from "../../../convex/voiceTranscript";

const logger = createLogger("voice.settle-call");

const SettleVoiceCallSchema = z.object({
  callId: z.string().min(1).max(64),
  elevenConversationId: z.string().min(1).max(64),
});

const ConversationSchema = ElevenConversationSchema.extend({ agent_id: z.string(), status: z.string() });

/** ElevenLabs ids are `conv_` plus letters and digits; anything else never reaches its URL. */
const CONVERSATION_ID = /^conv_[a-z0-9]+$/i;
const ATTEMPTS = 5;

export type SettleVoiceCallResult = { status: "failed" | "pending" | "rejected" | "settled" };

/**
 * Settles a call the browser watched connect and end, without waiting on the post-call webhook,
 * which can be slow, fail, or (in dev) go to another deployment. Trusts only ElevenLabs' own record:
 * our agent, our call id, finished. Convex then checks the call is the cookie session's and writes
 * it exactly as the webhook would, once per ElevenLabs conversation whichever lands first.
 */
export const settleVoiceCallForRequest = createServerOnlyFn(
  async (
    { callId, elevenConversationId }: z.infer<typeof SettleVoiceCallSchema>,
    { waitMs = 2000 }: { waitMs?: number } = {},
  ): Promise<SettleVoiceCallResult> => {
    if (!CONVERSATION_ID.test(elevenConversationId)) return { status: "rejected" };
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const serverSecret = process.env.VOICE_SERVER_SECRET;
    const { sessionId } = (await getConversationSession()).data;
    if (!apiKey || !serverSecret || !sessionId) return { status: "failed" };

    for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
      if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, waitMs));
      const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${elevenConversationId}`, {
        headers: { "xi-api-key": apiKey },
      }).catch(() => null);
      if (!response) continue;
      if (response.status >= 400 && response.status < 500) return { status: "rejected" };
      if (!response.ok) continue;

      const parsed = ConversationSchema.safeParse(await response.json().catch(() => null));
      if (!parsed.success) return { status: "failed" };
      const conversation = parsed.data;
      if (
        conversation.agent_id !== VOICE_AGENT_ID ||
        conversation.conversation_id !== elevenConversationId ||
        conversation.conversation_initiation_client_data.dynamic_variables.call_id !== callId
      ) {
        logger.warn("voice settle refused", { callId, elevenConversationId });
        return { status: "rejected" };
      }
      if (conversation.status === "failed") return { status: "failed" };
      if (conversation.status !== "done") continue;

      const result = await fetchAuthMutation(api.voiceCalls.settleVoiceCall, {
        ...toVoiceTranscriptArgs(conversation),
        serverSecret,
        sessionId,
      }).catch((error: unknown) => {
        logger.error("voice settle failed", { callId, elevenConversationId, error });
        return null;
      });
      if (!result) return { status: "failed" };
      const { settled } = result;
      logger.info("voice call settled", { callId, elevenConversationId, settled });
      return { status: settled ? "settled" : "rejected" };
    }
    return { status: "pending" };
  },
);

export const settleVoiceCall = createServerFn({ method: "POST" })
  .validator(SettleVoiceCallSchema)
  .handler(async ({ data }) => settleVoiceCallForRequest(data));
