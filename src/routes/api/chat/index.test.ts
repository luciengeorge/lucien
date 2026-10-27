import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("#/lib/auth-server", () => ({
  fetchAuthAction: vi.fn(),
  fetchAuthMutation: vi.fn(),
  fetchAuthQuery: vi.fn(),
}));
vi.mock("#/lib/conversation-session.server", () => ({ getConversationSession: vi.fn() }));
vi.mock("#/lib/notify-slack", () => ({ postContactToSlack: vi.fn() }));
vi.mock("@vercel/functions", () => ({ waitUntil: vi.fn() }));
vi.mock("#/lib/chat/classify-mood", () => ({ classifyMood: vi.fn() }));
vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();
  return { ...actual, generateText: vi.fn(), streamText: vi.fn(), validateUIMessages: vi.fn() };
});

import type { TextStreamPart, ToolSet, UIMessage, UIMessageStreamOnFinishCallback } from "ai";

import { fetchAuthAction, fetchAuthMutation, fetchAuthQuery } from "#/lib/auth-server";
import { classifyMood } from "#/lib/chat/classify-mood";
import { getConversationSession } from "#/lib/conversation-session.server";
import { postContactToSlack } from "#/lib/notify-slack";
import { waitUntil } from "@vercel/functions";
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
    vi.mocked(classifyMood).mockResolvedValue(null);
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

    /*
     * The cookie holds the newest conversation, so "New conversation" in a
     * second tab used to lock the first tab out with a 401 it could never
     * recover from. Ownership is the session's, checked by the query.
     */
    it("serves an older conversation the session still owns", async () => {
      vi.mocked(getConversationSession, { partial: true }).mockResolvedValue({
        data: { conversationId: "newer-conversation", sessionId: "sess-1" },
      });
      const res = await invokePost(postRequest(validBody));
      expect(res.status).toBe(200);
      expect(vi.mocked(fetchAuthQuery)).toHaveBeenCalledWith(expect.anything(), {
        conversationId: "conv-123",
        sessionId: "sess-1",
      });
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

  describe("context and persistence", () => {
    it("sends the whole content corpus, with no query rewrite or vector search first", async () => {
      await invokePost(postRequest(validBody));
      const system = vi.mocked(streamText).mock.calls[0]?.[0].system;
      expect(system).toContain('<document source="bio.md">');
      expect(system).toContain('<document source="shopify.md">');
      expect(vi.mocked(generateText)).not.toHaveBeenCalled();
      expect(vi.mocked(fetchAuthAction)).not.toHaveBeenCalled();
    });

    it("stops generating when the visitor stops the reply", async () => {
      const request = postRequest(validBody);
      await invokePost(request);
      expect(vi.mocked(streamText).mock.calls[0]?.[0].abortSignal).toBe(request.signal);
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

    it("strips em-dashes and en-dashes from the persisted assistant message", async () => {
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
        parts: [{ text: "Yes — I've sent your message, 2020–2024.", type: "text" }],
        role: "assistant",
      };
      const sanitizedMessage: UIMessage = {
        id: "asst-1",
        parts: [{ text: "Yes - I've sent your message, 2020-2024.", type: "text" }],
        role: "assistant",
      };
      await captured?.({ isAborted: false, isContinuation: false, messages: [], responseMessage });

      expect(vi.mocked(fetchAuthMutation)).toHaveBeenCalledWith(expect.anything(), {
        conversationId: "conv-123",
        messageJson: JSON.stringify(sanitizedMessage),
        sessionId: "sess-1",
      });
    });

    it("skips persisting an empty assistant message and warns instead", async () => {
      let captured: UIMessageStreamOnFinishCallback<UIMessage> | undefined;
      vi.mocked(streamText, { partial: true }).mockReturnValue({
        toUIMessageStreamResponse: (options?: { onFinish?: UIMessageStreamOnFinishCallback<UIMessage> }) => {
          captured = options?.onFinish;
          return new Response("stream", { status: 200 });
        },
      });

      await invokePost(postRequest(validBody));
      const emptyResponseMessage: UIMessage = {
        id: "asst-1",
        parts: [{ text: "", type: "text" }],
        role: "assistant",
      };
      const persistCallsBefore = vi.mocked(fetchAuthMutation).mock.calls.length;
      await captured?.({
        isAborted: false,
        isContinuation: false,
        messages: [],
        responseMessage: emptyResponseMessage,
      });

      // No additional fetchAuthMutation call beyond what already happened (rate limit + user message persist).
      expect(vi.mocked(fetchAuthMutation).mock.calls.length).toBe(persistCallsBefore);
      expect(vi.mocked(fetchAuthMutation)).not.toHaveBeenCalledWith(expect.anything(), {
        conversationId: "conv-123",
        messageJson: JSON.stringify(emptyResponseMessage),
        sessionId: "sess-1",
      });
    });

    it("forgets the question when the visitor stops the reply before any of it arrives", async () => {
      // Undo send: the client puts the question back in the composer, so the stored copy must go,
      // or it returns on reload and the model reads an unanswered question in its history.
      let captured: UIMessageStreamOnFinishCallback<UIMessage> | undefined;
      vi.mocked(streamText, { partial: true }).mockReturnValue({
        toUIMessageStreamResponse: (options?: { onFinish?: UIMessageStreamOnFinishCallback<UIMessage> }) => {
          captured = options?.onFinish;
          return new Response("stream", { status: 200 });
        },
      });

      await invokePost(postRequest(validBody));
      await captured?.({
        isAborted: true,
        isContinuation: false,
        messages: [],
        responseMessage: { id: "asst-1", parts: [], role: "assistant" },
      });

      expect(vi.mocked(fetchAuthMutation)).toHaveBeenCalledWith(expect.anything(), {
        conversationId: "conv-123",
        sessionId: "sess-1",
        uiMessageId: "m1",
      });
    });

    it("keeps the question when a stopped reply had already written something", async () => {
      let captured: UIMessageStreamOnFinishCallback<UIMessage> | undefined;
      vi.mocked(streamText, { partial: true }).mockReturnValue({
        toUIMessageStreamResponse: (options?: { onFinish?: UIMessageStreamOnFinishCallback<UIMessage> }) => {
          captured = options?.onFinish;
          return new Response("stream", { status: 200 });
        },
      });

      await invokePost(postRequest(validBody));
      await captured?.({
        isAborted: true,
        isContinuation: false,
        messages: [],
        responseMessage: { id: "asst-1", parts: [{ text: "Lucien is", type: "text" }], role: "assistant" },
      });

      expect(vi.mocked(fetchAuthMutation)).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ uiMessageId: "m1" }),
      );
    });

    it("keeps the function alive until the turn is saved, since Stop now terminates it on Vercel", async () => {
      // With supportsCancellation, a visitor's Stop terminates the function; only work handed to
      // waitUntil survives. So the persistence has to be registered before the stream can end.
      let captured: UIMessageStreamOnFinishCallback<UIMessage> | undefined;
      let capturedOnError: ((error: unknown) => string) | undefined;
      vi.mocked(streamText, { partial: true }).mockReturnValue({
        toUIMessageStreamResponse: (options?: {
          onError?: (error: unknown) => string;
          onFinish?: UIMessageStreamOnFinishCallback<UIMessage>;
        }) => {
          captured = options?.onFinish;
          capturedOnError = options?.onError;
          return new Response("stream", { status: 200 });
        },
      });

      await invokePost(postRequest(validBody));
      // A tool error mid-stream reaches onError, but the stream carries on and onFinish still runs.
      capturedOnError?.(new Error("tool input too long"));
      const kept = vi.mocked(waitUntil).mock.calls[0]?.[0];
      expect(kept).toBeInstanceOf(Promise);
      let settled = false;
      void kept?.then(() => {
        settled = true;
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(settled).toBe(false);

      await captured?.({
        isAborted: true,
        isContinuation: false,
        messages: [],
        responseMessage: { id: "asst-1", parts: [], role: "assistant" },
      });
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(settled).toBe(true);
      expect(vi.mocked(fetchAuthMutation)).toHaveBeenCalledWith(expect.anything(), {
        conversationId: "conv-123",
        sessionId: "sess-1",
        uiMessageId: "m1",
      });
    });

    it("registers a stream transform that strips dashes from streamed text", async () => {
      await invokePost(postRequest(validBody));
      const call = vi.mocked(streamText).mock.calls[0]?.[0];
      const transform = call?.experimental_transform;
      if (typeof transform !== "function") {
        throw new Error("streamText was not called with a function experimental_transform");
      }

      const transformStream: TransformStream<TextStreamPart<ToolSet>, TextStreamPart<ToolSet>> = transform({
        stopStream: () => {},
        tools: {},
      });
      const writer = transformStream.writable.getWriter();
      const reader = transformStream.readable.getReader();
      const readPromise = reader.read();
      await writer.write({ id: "t1", text: "Yes — I've sent it.", type: "text-delta" });
      const { value } = await readPromise;
      expect(value).toEqual({ id: "t1", text: "Yes - I've sent it.", type: "text-delta" });
      await writer.close();
    });
  });

  describe("mood", () => {
    type Part = TextStreamPart<ToolSet>;
    type MessageMetadata = (options: { part: Part }) => unknown;

    const usage = {
      inputTokenDetails: { cacheReadTokens: 0, cacheWriteTokens: 0, noCacheTokens: 0 },
      inputTokens: 0,
      outputTokenDetails: { reasoningTokens: 0, textTokens: 0 },
      outputTokens: 0,
      totalTokens: 0,
    };
    const delta = (text: string): Part => ({ id: "t1", text, type: "text-delta" });
    const finish = (finishReason: "error" | "stop"): Part => ({
      finishReason,
      rawFinishReason: finishReason,
      totalUsage: usage,
      type: "finish",
    });

    /** Runs parts through the route's transform and its messageMetadata, as toUIMessageStream does. */
    async function openReply() {
      let messageMetadata: MessageMetadata | undefined;
      vi.mocked(streamText, { partial: true }).mockReturnValue({
        toUIMessageStreamResponse: (options?: { messageMetadata?: MessageMetadata }) => {
          messageMetadata = options?.messageMetadata;
          return new Response("stream", { status: 200 });
        },
      });
      await invokePost(postRequest(validBody));
      const transform = vi.mocked(streamText).mock.calls[0]?.[0].experimental_transform;
      if (typeof transform !== "function") throw new Error("no experimental_transform");
      const stream: TransformStream<Part, Part> = transform({ stopStream: () => {}, tools: {} });
      const out: { metadata: unknown; part: Part }[] = [];
      const reader = stream.readable.getReader();
      const reading = (async () => {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) return;
          out.push({ metadata: messageMetadata?.({ part: value }), part: value });
        }
      })();
      const writer = stream.writable.getWriter();
      return {
        out,
        async end() {
          await writer.close();
          await reading;
        },
        write: (part: Part) => writer.write(part),
      };
    }

    it("classifies the finished reply from the visitor's question, and sends the mood with the finish", async () => {
      vi.mocked(classifyMood).mockResolvedValue("sheepish");
      const reply = await openReply();
      for (const part of [delta("I don't"), delta(" know that one."), finish("stop")]) await reply.write(part);
      await reply.end();

      expect(vi.mocked(classifyMood)).toHaveBeenCalledWith({
        question: "hello",
        reply: "I don't know that one.",
        signal: expect.any(AbortSignal),
      });
      expect(reply.out.map(({ metadata }) => metadata)).toEqual([undefined, undefined, { mood: "sheepish" }]);
    });

    it("streams the words without waiting for the mood", async () => {
      let resolveMood: (mood: "happy") => void = () => {};
      vi.mocked(classifyMood).mockReturnValue(
        new Promise((resolve) => {
          resolveMood = resolve;
        }),
      );
      const reply = await openReply();
      await reply.write(delta("Hello"));
      await reply.write(delta(" there."));
      const finishing = reply.write(finish("stop"));
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(reply.out.map(({ part }) => part.type)).toEqual(["text-delta", "text-delta"]);
      resolveMood("happy");
      await finishing;
      await reply.end();
      expect(reply.out.at(-1)).toEqual({ metadata: { mood: "happy" }, part: finish("stop") });
    });

    it("finishes the reply untouched, with no mood, when classifying fails or times out", async () => {
      vi.mocked(classifyMood).mockResolvedValue(null);
      const reply = await openReply();
      for (const part of [delta("Hello."), finish("stop")]) await reply.write(part);
      await reply.end();

      expect(reply.out).toEqual([
        { metadata: undefined, part: delta("Hello.") },
        { metadata: undefined, part: finish("stop") },
      ]);
    });

    it("does not classify a reply that ended in an error, or one with no words", async () => {
      const errored = await openReply();
      for (const part of [delta("Hel"), finish("error")]) await errored.write(part);
      await errored.end();
      vi.mocked(streamText).mockClear();

      const wordless = await openReply();
      await wordless.write(finish("stop"));
      await wordless.end();

      expect(vi.mocked(classifyMood)).not.toHaveBeenCalled();
    });

    it("never saves the mood", async () => {
      let captured: UIMessageStreamOnFinishCallback<UIMessage> | undefined;
      vi.mocked(streamText, { partial: true }).mockReturnValue({
        toUIMessageStreamResponse: (options?: { onFinish?: UIMessageStreamOnFinishCallback<UIMessage> }) => {
          captured = options?.onFinish;
          return new Response("stream", { status: 200 });
        },
      });

      await invokePost(postRequest(validBody));
      await captured?.({
        isAborted: false,
        isContinuation: false,
        messages: [],
        responseMessage: {
          id: "asst-1",
          metadata: { mood: "happy" },
          parts: [{ text: "Hi there.", type: "text" }],
          role: "assistant",
        },
      });

      expect(vi.mocked(fetchAuthMutation)).toHaveBeenCalledWith(expect.anything(), {
        conversationId: "conv-123",
        messageJson: JSON.stringify({ id: "asst-1", parts: [{ text: "Hi there.", type: "text" }], role: "assistant" }),
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
        contact: undefined,
        conversationId: "conv-123",
        message: "hi Lucien",
        name: undefined,
      });
    });

    it("contact_lucien passes the visitor's name and contact through to Slack", async () => {
      vi.mocked(postContactToSlack).mockResolvedValue(true);
      await invokePost(postRequest(validBody));
      const tools = getRegisteredTools();
      await tools.contact_lucien?.execute?.(
        { contact: "ada@example.com", message: "please reach out", name: "Ada" },
        execOptions,
      );
      expect(vi.mocked(postContactToSlack)).toHaveBeenCalledWith({
        contact: "ada@example.com",
        conversationId: "conv-123",
        message: "please reach out",
        name: "Ada",
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
