import { z } from "zod";

import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { VOICE_AGENT_ID } from "./voiceAgent";
import { ElevenConversationSchema, toVoiceTranscriptArgs } from "./voiceTranscript";

/** ElevenLabs' own tolerance: a delivery signed longer ago than this may be a replay. */
const SIGNATURE_MAX_AGE_SECS = 30 * 60;

const EventSchema = z.object({ type: z.string() });
const AgentSchema = z.object({ data: z.object({ agent_id: z.string() }) });
const TranscriptionSchema = z.object({ data: ElevenConversationSchema });

const encoder = new TextEncoder();

/** Checks the `ElevenLabs-Signature` header: `t=<unix secs>,v0=<hex HMAC-SHA256 of "<t>.<raw body>">`. */
async function isSignedByElevenLabs(rawBody: string, header: string | null, secret: string | undefined) {
  if (!secret || !header) return false;
  const fields = new Map(
    header.split(",").map((field) => {
      const separator = field.indexOf("=");
      return [field.slice(0, separator), field.slice(separator + 1)];
    }),
  );
  const timestamp = fields.get("t") ?? "";
  const signature = fields.get("v0") ?? "";
  if (!/^\d+$/.test(timestamp) || !/^[0-9a-f]{64}$/i.test(signature)) return false;
  if (Date.now() / 1000 - Number(timestamp) > SIGNATURE_MAX_AGE_SECS) return false;

  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { hash: "SHA-256", name: "HMAC" }, false, [
    "verify",
  ]);
  const signatureBytes = Uint8Array.from(signature.match(/../g) ?? [], (byte) => Number.parseInt(byte, 16));
  // subtle.verify compares in constant time.
  return await crypto.subtle.verify("HMAC", key, signatureBytes, encoder.encode(`${timestamp}.${rawBody}`));
}

function ok() {
  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" }, status: 200 });
}

export const postCallWebhook = httpAction(async (ctx, request) => {
  const rawBody = await request.text();
  const signed = await isSignedByElevenLabs(
    rawBody,
    request.headers.get("ElevenLabs-Signature"),
    process.env.ELEVENLABS_WEBHOOK_SECRET,
  );
  if (!signed) return new Response("Unauthorized", { status: 401 });

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  const event = EventSchema.safeParse(body);
  if (!event.success) return new Response("Invalid event", { status: 400 });
  if (event.data.type !== "post_call_transcription") return ok();

  const agent = AgentSchema.safeParse(body);
  if (agent.success && agent.data.data.agent_id !== VOICE_AGENT_ID) return ok();

  const transcription = TranscriptionSchema.safeParse(body);
  if (!agent.success || !transcription.success) {
    console.error("post_call_transcription without the fields to settle a call", transcription.error?.message);
    return new Response("Invalid transcription", { status: 400 });
  }
  await ctx.runMutation(internal.voiceCalls.recordVoiceTranscript, toVoiceTranscriptArgs(transcription.data.data));
  return ok();
});
