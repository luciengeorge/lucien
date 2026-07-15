import { createLogger } from "#/lib/logger";

const logger = createLogger("notify-slack");

export interface ContactSlackPayload {
  conversationId: string;
  from?: string;
  message: string;
}

/**
 * Posts a visitor's `contact_lucien` message to Slack as plain-text Block Kit blocks
 * (never mrkdwn/HTML) so untrusted visitor input can't be used to inject formatting
 * or links into Slack's render.
 *
 * Graceful degradation: returns false (never throws) when SLACK_WEBHOOK_URL is unset
 * or the POST fails, so callers can report an honest "couldn't send" outcome.
 */
export async function postContactToSlack({ conversationId, from, message }: ContactSlackPayload): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    logger.warn("SLACK_WEBHOOK_URL not set, skipping contact notification", { conversationId });
    return false;
  }

  const blocks = [
    {
      text: { text: "New portfolio contact request", type: "plain_text" },
      type: "section",
    },
    {
      text: { text: message, type: "plain_text" },
      type: "section",
    },
    ...(from ? [{ elements: [{ text: `From: ${from}`, type: "plain_text" }], type: "context" }] : []),
    {
      elements: [{ text: `Conversation: ${conversationId}`, type: "plain_text" }],
      type: "context",
    },
  ];

  try {
    const response = await fetch(webhookUrl, {
      body: JSON.stringify({ blocks }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    if (!response.ok) {
      logger.warn("slack webhook responded with a non-ok status", { conversationId, status: response.status });
      return false;
    }
    return true;
  } catch (error) {
    logger.warn("slack webhook post failed", { conversationId, error });
    return false;
  }
}
