import { fetchAuthMutation } from "#/lib/auth-server";
import { getConversationSession } from "#/lib/conversation-session.server";
import { createLogger } from "#/lib/logger";
import { postContactToSlack } from "#/lib/notify-slack";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";

import { api } from "../../../convex/_generated/api";

const logger = createLogger("contact.send");

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || undefined);

/** The chat's `contact_lucien` tool limits, for the form a voice call opens. */
export const ContactMessageSchema = z.object({
  contact: optionalText(200),
  message: z.string().trim().min(1).max(2000),
  name: optionalText(120),
});

export type ContactMessage = z.input<typeof ContactMessageSchema>;

/**
 * The chat's contact path without the model in between: the same Slack post, gated by Convex to a
 * session fresh from a voice call and a few messages a day, since no model stands in the way here.
 */
export const sendContactMessageForRequest = createServerOnlyFn(
  async (input: ContactMessage): Promise<{ status: "failed" | "sent" }> => {
    const { contact, message, name } = ContactMessageSchema.parse(input);
    const serverSecret = process.env.VOICE_SERVER_SECRET;
    const { conversationId, sessionId } = (await getConversationSession()).data;
    if (!conversationId || !sessionId || !serverSecret) {
      logger.warn("contact refused", { outcome: serverSecret ? "no_conversation" : "missing_server_secret" });
      return { status: "failed" };
    }

    const ip =
      getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() || getRequestHeader("x-real-ip")?.trim() || "unknown";
    const gate = await fetchAuthMutation(api.voiceCalls.allowVoiceContact, { ip, serverSecret, sessionId });
    if (!gate.allowed) {
      logger.warn("contact refused by its limits", { conversationId });
      return { status: "failed" };
    }

    const sent = await postContactToSlack({ contact, conversationId, message, name });
    return { status: sent ? "sent" : "failed" };
  },
);

export const sendContactMessage = createServerFn({ method: "POST" })
  .validator(ContactMessageSchema)
  .handler(async ({ data }) => sendContactMessageForRequest(data));
