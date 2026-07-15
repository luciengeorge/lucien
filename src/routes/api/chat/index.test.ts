import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("#/lib/auth-server", () => ({
  fetchAuthAction: vi.fn(),
  fetchAuthMutation: vi.fn(),
  fetchAuthQuery: vi.fn(),
}));
vi.mock("#/lib/conversation-session.server", () => ({ getConversationSession: vi.fn() }));
vi.mock("#/lib/notify-slack", () => ({ postContactToSlack: vi.fn() }));
vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();
  return { ...actual, generateText: vi.fn(), streamText: vi.fn(), validateUIMessages: vi.fn() };
});

import type { UIMessage, UIMessageStreamOnFinishCallback } from "ai";

import { fetchAuthAction, fetchAuthMutation, fetchAuthQuery } from "#/lib/auth-server";
import { getConversationSession } from "#/lib/conversation-session.server";
import { postContactToSlack } from "#/lib/notify-slack";
import { generateText, streamText, validateUIMessages } from "ai";

import { Route } from "./index";

type SimplePostHandler = (ctx: { request: Request }) => Promise<Response> | Response;

function isPostHandler(value: unknown): value is SimplePostHandler {
  return typeof value === "function";
}

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/chat/", {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
}

const validBody = {
  id: "conv-123",
  message: { id: "m1", parts: [{ type: "text", text: "hello" }], role: "user" },
};

function getPostHandler() {
  const handlers = Route.options.server?.handlers;
  if (typeof handlers !== "object" || handlers === null) {
    throw new Error("Route.options.server.handlers is not an object");
  }
  return handlers.POST;
}

function invokePost(request: Request) {
  const post = getPostHandler();
  if (!isPostHandler(post)) {
    throw new Error("Route.options.server.handlers.POST is not a function");
  }
  return post({ request });
}

describe("POST /api/chat", () => {
  it("exposes the POST handler", () => {
    expect(typeof getPostHandler()).toBe("function");
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getConversationSession, { partial: true }).mockResolvedValue({
      data: { conversationId: "conv-123", sessionId: "sess-1" },
    });
    vi.mocked(fetchAuthQuery).mockResolvedValue({
      conversation: { createdAt: 0, id: "conv-123", sessionId: "sess-1", updatedAt: 0 },
      serializedMessages: [],
    });
    vi.mocked(validateUIMessages, { partial: true }).mockResolvedValue([
      { id: "m1", parts: [{ text: "hello", type: "text" }], role: "user" },
    ]);
    vi.mocked(generateText, { partial: true }).mockResolvedValue({ text: "expanded query" });
    vi.mocked(fetchAuthAction).mockResolvedValue("CTX");
    vi.mocked(fetchAuthMutation).mockResolvedValue({ allowed: true, retryAfter: 0 });
    vi.mocked(streamText, { partial: true }).mockReturnValue({
      toUIMessageStreamResponse: () => new Response("stream", { status: 200 }),
    });
  });

  describe("status codes", () => {
    it("returns 400 on an invalid body", async () => {
      const res = await invokePost(postRequest({}));
      expect(res.status).toBe(400);
    });

    it("returns 401 when sessionId is missing", async () => {
      vi.mocked(getConversationSession, { partial: true }).mockResolvedValue({ data: {} });
      const res = await invokePost(postRequest(validBody));
      expect(res.status).toBe(401);
    });

    it("returns 401 when conversationId mismatches the session", async () => {
      vi.mocked(getConversationSession, { partial: true }).mockResolvedValue({
        data: { conversationId: "other", sessionId: "sess-1" },
      });
      const res = await invokePost(postRequest(validBody));
      expect(res.status).toBe(401);
    });

    it("returns 404 when the conversation is not found", async () => {
      vi.mocked(fetchAuthQuery).mockResolvedValue(null);
      const res = await invokePost(postRequest(validBody));
      expect(res.status).toBe(404);
    });

    it("returns 200 on the happy path", async () => {
      const res = await invokePost(postRequest(validBody));
      expect(res.status).toBe(200);
    });

    it("returns 429 with a Retry-After header when the rate limit is exceeded", async () => {
      vi.mocked(fetchAuthMutation).mockResolvedValue({ allowed: false, retryAfter: 5000 });
      const res = await invokePost(postRequest(validBody));
      expect(res.status).toBe(429);
      expect(res.headers.get("Retry-After")).toBe("5");
    });
  });

  describe("query expansion, RAG, and persistence", () => {
    it("falls back to the raw query when query expansion fails", async () => {
      vi.mocked(generateText).mockRejectedValue(new Error("boom"));
      await invokePost(postRequest(validBody));
      expect(vi.mocked(fetchAuthAction)).toHaveBeenCalledWith(expect.anything(), { query: "hello" });
    });

    it("swallows RAG search failures and still streams a 200", async () => {
      vi.mocked(fetchAuthAction).mockRejectedValue(new Error("rag down"));
      const res = await invokePost(postRequest(validBody));
      expect(res.status).toBe(200);
      expect(vi.mocked(streamText)).toHaveBeenCalled();
    });

    it("persists the user message before streaming starts", async () => {
      await invokePost(postRequest(validBody));
      // Call 1 is the rate-limit check (runs before conversation lookup); call 2 persists the user message.
      expect(vi.mocked(fetchAuthMutation)).toHaveBeenNthCalledWith(2, expect.anything(), {
        conversationId: "conv-123",
        messageJson: JSON.stringify(validBody.message),
        sessionId: "sess-1",
      });
      expect(vi.mocked(fetchAuthMutation).mock.invocationCallOrder[1]).toBeLessThan(
        vi.mocked(streamText).mock.invocationCallOrder[0]!,
      );
    });

    it("persists the assistant message when the stream's onFinish callback runs", async () => {
      let captured: UIMessageStreamOnFinishCallback<UIMessage> | undefined;
      vi.mocked(streamText, { partial: true }).mockReturnValue({
        toUIMessageStreamResponse: (options?: { onFinish?: UIMessageStreamOnFinishCallback<UIMessage> }) => {
          captured = options?.onFinish;
          return new Response("stream", { status: 200 });
        },
      });

      await invokePost(postRequest(validBody));
      const responseMessage: UIMessage = {
        id: "asst-1",
        parts: [{ text: "hi", type: "text" }],
        role: "assistant",
      };
      await captured?.({ isAborted: false, isContinuation: false, messages: [], responseMessage });

      expect(vi.mocked(fetchAuthMutation)).toHaveBeenCalledWith(expect.anything(), {
        conversationId: "conv-123",
        messageJson: JSON.stringify(responseMessage),
        sessionId: "sess-1",
      });
    });
  });

  describe("tools", () => {
    const execOptions = { messages: [], toolCallId: "test-call" };

    function getRegisteredTools() {
      const call = vi.mocked(streamText).mock.calls[0]?.[0];
      const tools = call?.tools;
      if (typeof tools !== "object" || tools === null) {
        throw new Error("streamText was not called with a tools object");
      }
      return tools;
    }

    it("registers download_resume, link_work_entry, and contact_lucien", async () => {
      await invokePost(postRequest(validBody));
      const tools = getRegisteredTools();
      expect(Object.keys(tools)).toEqual(
        expect.arrayContaining(["download_resume", "link_work_entry", "contact_lucien"]),
      );
    });

    it("link_work_entry returns the case study url for a known slug", async () => {
      await invokePost(postRequest(validBody));
      const tools = getRegisteredTools();
      await expect(tools.link_work_entry?.execute?.({ slug: "fyxer" }, execOptions)).resolves.toEqual({
        company: "Fyxer",
        role: "Senior Product Engineer",
        slug: "fyxer",
        url: "/work/fyxer",
      });
    });

    it("contact_lucien returns status 'sent' when the Slack post succeeds", async () => {
      vi.mocked(postContactToSlack).mockResolvedValue(true);
      await invokePost(postRequest(validBody));
      const tools = getRegisteredTools();
      await expect(tools.contact_lucien?.execute?.({ message: "hi Lucien" }, execOptions)).resolves.toEqual({
        status: "sent",
      });
      expect(vi.mocked(postContactToSlack)).toHaveBeenCalledWith({
        conversationId: "conv-123",
        from: undefined,
        message: "hi Lucien",
      });
    });

    it("contact_lucien returns status 'failed' when the Slack post fails", async () => {
      vi.mocked(postContactToSlack).mockResolvedValue(false);
      await invokePost(postRequest(validBody));
      const tools = getRegisteredTools();
      await expect(tools.contact_lucien?.execute?.({ message: "hi Lucien" }, execOptions)).resolves.toEqual({
        status: "failed",
      });
    });
  });
});
