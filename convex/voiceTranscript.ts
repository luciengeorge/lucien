import { z } from "zod";

/**
 * An ElevenLabs conversation, as both its post-call webhook (`data`) and its conversations API
 * return it. Only what settling the call needs is required; odd turns are skipped, not refused.
 * Free of Convex imports so the app server can parse the API's answer with the same rules.
 */
export const ElevenConversationSchema = z.object({
  conversation_id: z.string(),
  conversation_initiation_client_data: z.object({ dynamic_variables: z.object({ call_id: z.string() }) }),
  metadata: z.object({
    call_duration_secs: z.number(),
    start_time_unix_secs: z.number().optional().catch(undefined),
  }),
  transcript: z.array(z.unknown()).catch([]),
});

export type ElevenConversation = z.infer<typeof ElevenConversationSchema>;

const TurnSchema = z.object({
  message: z.string().nullish(),
  role: z.enum(["agent", "user"]),
  time_in_call_secs: z.number(),
});

/** The arguments `recordVoiceTranscript` (and `settleVoiceCall`) take, from either source. */
export function toVoiceTranscriptArgs(conversation: ElevenConversation) {
  return {
    callId: conversation.conversation_initiation_client_data.dynamic_variables.call_id,
    conversationStartedAtSecs: conversation.metadata.start_time_unix_secs,
    durationSecs: conversation.metadata.call_duration_secs,
    elevenConversationId: conversation.conversation_id,
    transcript: conversation.transcript.flatMap((raw, index) => {
      const turn = TurnSchema.safeParse(raw);
      if (!turn.success) return [];
      return {
        index,
        message: turn.data.message ?? null,
        role: turn.data.role,
        timeInCallSecs: turn.data.time_in_call_secs,
      };
    }),
  };
}
