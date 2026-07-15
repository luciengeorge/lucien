import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { postContactToSlack } from "./notify-slack";

function parseFetchBody(callIndex: number): unknown {
  const [, options] = vi.mocked(global.fetch).mock.calls[callIndex];
  const body = options?.body;
  if (typeof body !== "string") throw new Error("expected fetch to be called with a string body");
  return JSON.parse(body);
}

describe("postContactToSlack", () => {
  const originalEnv = process.env.SLACK_WEBHOOK_URL;
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    process.env.SLACK_WEBHOOK_URL = originalEnv;
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it("returns false and does not call fetch when SLACK_WEBHOOK_URL is unset", async () => {
    delete process.env.SLACK_WEBHOOK_URL;
    const sent = await postContactToSlack({ conversationId: "conv-1", message: "hi" });
    expect(sent).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("posts a Block Kit payload to the webhook URL and returns true on success", async () => {
    process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.test/webhook";
    vi.mocked(global.fetch).mockResolvedValue(new Response(null, { status: 200 }));

    const sent = await postContactToSlack({ conversationId: "conv-1", from: "Ada", message: "hello there" });

    expect(sent).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://hooks.slack.test/webhook",
      expect.objectContaining({
        method: "POST",
        headers: { "content-type": "application/json" },
      }),
    );
    const blockText = JSON.stringify(parseFetchBody(0));
    expect(blockText).toContain("hello there");
    expect(blockText).toContain("Ada");
    expect(blockText).toContain("conv-1");
  });

  it("omits a from block when from is not provided", async () => {
    process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.test/webhook";
    vi.mocked(global.fetch).mockResolvedValue(new Response(null, { status: 200 }));

    await postContactToSlack({ conversationId: "conv-2", message: "no name given" });

    const blockText = JSON.stringify(parseFetchBody(0));
    expect(blockText).not.toContain("From:");
  });

  it("returns false when the webhook responds with a non-ok status", async () => {
    process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.test/webhook";
    vi.mocked(global.fetch).mockResolvedValue(new Response(null, { status: 500 }));

    const sent = await postContactToSlack({ conversationId: "conv-3", message: "hi" });
    expect(sent).toBe(false);
  });

  it("returns false and does not throw when fetch rejects", async () => {
    process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.test/webhook";
    vi.mocked(global.fetch).mockRejectedValue(new Error("network down"));

    const sent = await postContactToSlack({ conversationId: "conv-4", message: "hi" });
    expect(sent).toBe(false);
  });
});
