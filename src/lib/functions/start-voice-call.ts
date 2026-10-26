import { fetchAuthMutation } from "#/lib/auth-server";
import { ConversationIdSchema } from "#/lib/chat-types";
import { formatPromptDate } from "#/lib/chat/system-prompt";
import { getConversationSession } from "#/lib/conversation-session.server";
import { getOrCreateCorrelationId } from "#/lib/correlation-id";
import { startConversation } from "#/lib/functions/start-new-conversation";
import { createLogger } from "#/lib/logger";
import { postVoiceOutageToSlack } from "#/lib/notify-slack";
import { VOICE_AGENT_ID } from "#/lib/voice/agent-config";
import { isVoiceResting } from "#/lib/voice/voice-resting.server";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";

import { api } from "../../../convex/_generated/api";
import { isAccountRefusal } from "../../../convex/voiceLimits";

const logger = createLogger("voice.start-call");

const TokenResponseSchema = z.object({ token: z.string().min(1) });

export type StartVoiceCallResult =
  | { ok: true; callId: string; conversationId: string; maxSecs: number; today: string; token: string }
  | { ok: false; reason: "call_active" | "global_limit" | "ip_limit" | "resting" | "unavailable" | "visitor_limit" };

class TokenRefusedError extends Error {
  constructor(readonly status: number) {
    super(`ElevenLabs token request failed (${status})`);
  }
}

async function mintConversationToken(apiKey: string): Promise<string> {
  const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${VOICE_AGENT_ID}`, {
    headers: { "xi-api-key": apiKey },
  });
  if (!response.ok) throw new TokenRefusedError(response.status);
  return TokenResponseSchema.parse(await response.json()).token;
}

async function resolveConversation(correlationId: string) {
  const session = await getConversationSession();
  const { sessionId } = session.data;
  const conversationId = ConversationIdSchema.safeParse(session.data.conversationId);
  if (sessionId && conversationId.success) return { conversationId: conversationId.data, sessionId };

  const started = await startConversation(correlationId);
  const newConversationId = ConversationIdSchema.safeParse(started.conversation?.id);
  const newSessionId = started.conversation?.sessionId;
  if (!newConversationId.success || !newSessionId) throw new Error("Conversation creation failed");
  return { conversationId: newConversationId.data, sessionId: newSessionId };
}

export const startVoiceCallForRequest = createServerOnlyFn(
  async (correlationId: string): Promise<StartVoiceCallResult> => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const serverSecret = process.env.VOICE_SERVER_SECRET;
    if (!apiKey || !serverSecret) {
      logger.error("voice call unavailable", {
        correlationId,
        outcome: apiKey ? "missing_server_secret" : "missing_api_key",
      });
      return { ok: false, reason: "unavailable" };
    }

    // First, so a visitor is refused before any conversation, reservation or token.
    if (await isVoiceResting()) {
      logger.info("voice call refused", { correlationId, reason: "resting" });
      return { ok: false, reason: "resting" };
    }

    const { conversationId, sessionId } = await resolveConversation(correlationId);
    // Not x-vercel-id: it is unique per request, so every call would get a fresh IP allowance.
    const ip =
      getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() || getRequestHeader("x-real-ip")?.trim() || "unknown";
    const reservation = await fetchAuthMutation(api.voiceCalls.reserveVoiceCall, {
      conversationId,
      ip,
      serverSecret,
      sessionId,
    });
    if (!reservation.allowed) {
      logger.info("voice call refused", { conversationId, correlationId, reason: reservation.reason });
      return { ok: false, reason: reservation.reason };
    }

    try {
      const token = await mintConversationToken(apiKey);
      await fetchAuthMutation(api.voiceOutages.clearVoiceOutage, { serverSecret });
      logger.info("voice call started", {
        callId: reservation.callId,
        conversationId,
        correlationId,
        maxSecs: reservation.maxSecs,
      });
      return {
        callId: reservation.callId,
        conversationId,
        maxSecs: reservation.maxSecs,
        ok: true,
        today: formatPromptDate(new Date()),
        token,
      };
    } catch (error) {
      logger.error("voice call token failed", { callId: reservation.callId, conversationId, correlationId, error });
      await fetchAuthMutation(api.voiceCalls.releaseVoiceCall, { callId: reservation.callId, serverSecret, sessionId });
      if (!(error instanceof TokenRefusedError) || !isAccountRefusal(error.status))
        return { ok: false, reason: "unavailable" };

      const { opened } = await fetchAuthMutation(api.voiceOutages.recordVoiceMintFailure, {
        serverSecret,
        status: error.status,
      });
      if (opened) await postVoiceOutageToSlack({ status: error.status });
      return { ok: false, reason: "resting" };
    }
  },
);

export const startVoiceCall = createServerFn({ method: "POST" }).handler(
  async (): Promise<StartVoiceCallResult> =>
    startVoiceCallForRequest(getOrCreateCorrelationId(getRequestHeader("x-vercel-id"))),
);

/** Asked before the microphone, so a visitor never grants it only to hear voice is resting. */
export const checkVoiceResting = createServerFn({ method: "POST" }).handler(
  async (): Promise<boolean> => isVoiceResting(),
);
