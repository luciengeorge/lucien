import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("#/lib/auth-server", () => ({ fetchAuthMutation: vi.fn() }));
vi.mock("#/lib/conversation-session.server", () => ({ getConversationSession: vi.fn() }));
vi.mock("#/lib/notify-slack", () => ({ postContactToSlack: vi.fn() }));
vi.mock("@tanstack/react-start/server", () => ({ getRequestHeader: vi.fn() }));

import { fetchAuthMutation } from "#/lib/auth-server";
import { getConversationSession } from "#/lib/conversation-session.server";
import { postContactToSlack } from "#/lib/notify-slack";
import { getRequestHeader } from "@tanstack/react-start/server";
import { getFunctionName } from "convex/server";

import { ContactMessageSchema, sendContactMessageForRequest } from "./send-contact-message";

describe("sendContactMessageForRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getRequestHeader).mockImplementation((name) => (name === "x-forwarded-for" ? "9.9.9.9" : undefined));
    vi.mocked(getConversationSession, { partial: true }).mockResolvedValue({
      data: { conversationId: "conv-1", sessionId: "sess-1" },
    });
    vi.mocked(fetchAuthMutation).mockResolvedValue({ allowed: true });
    vi.mocked(postContactToSlack).mockResolvedValue(true);
    vi.stubEnv("VOICE_SERVER_SECRET", "server-secret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("passes the message to Lucien the way the chat's contact tool does", async () => {
    const result = await sendContactMessageForRequest({ contact: "ada@example.com", message: "Hi", name: "Ada" });

    expect(result).toEqual({ status: "sent" });
    expect(postContactToSlack).toHaveBeenCalledWith({
      contact: "ada@example.com",
      conversationId: "conv-1",
      message: "Hi",
      name: "Ada",
    });
  });

  it("asks Convex first, which only allows a session fresh from a call, a few times a day", async () => {
    vi.mocked(fetchAuthMutation).mockResolvedValue({ allowed: false });

    expect(await sendContactMessageForRequest({ message: "Hi" })).toEqual({ status: "failed" });
    const [fn, args] = vi.mocked(fetchAuthMutation).mock.calls[0] ?? [];
    expect(fn && getFunctionName(fn)).toBe("voiceCalls:allowVoiceContact");
    expect(args).toEqual({ ip: "9.9.9.9", serverSecret: "server-secret", sessionId: "sess-1" });
    expect(postContactToSlack).not.toHaveBeenCalled();
  });

  it("sends nothing without the server secret", async () => {
    vi.stubEnv("VOICE_SERVER_SECRET", "");

    expect(await sendContactMessageForRequest({ message: "Hi" })).toEqual({ status: "failed" });
    expect(fetchAuthMutation).not.toHaveBeenCalled();
    expect(postContactToSlack).not.toHaveBeenCalled();
  });

  it("refuses a browser with no conversation of its own", async () => {
    vi.mocked(getConversationSession, { partial: true }).mockResolvedValue({ data: {} });

    expect(await sendContactMessageForRequest({ message: "Hi" })).toEqual({ status: "failed" });
    expect(postContactToSlack).not.toHaveBeenCalled();
  });

  it("reports a Slack failure honestly", async () => {
    vi.mocked(postContactToSlack).mockResolvedValue(false);

    expect(await sendContactMessageForRequest({ message: "Hi" })).toEqual({ status: "failed" });
  });
});

describe("ContactMessageSchema", () => {
  it("holds the same limits as the chat's contact tool", () => {
    expect(ContactMessageSchema.safeParse({ message: "" }).success).toBe(false);
    expect(ContactMessageSchema.safeParse({ message: "x".repeat(2001) }).success).toBe(false);
    expect(ContactMessageSchema.safeParse({ message: "Hi", name: "x".repeat(121) }).success).toBe(false);
    expect(ContactMessageSchema.parse({ contact: "  ", message: " Hi ", name: "" })).toEqual({ message: "Hi" });
  });
});
