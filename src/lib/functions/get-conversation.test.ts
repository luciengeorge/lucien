import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("#/lib/auth-server", () => ({ fetchAuthQuery: vi.fn() }));
vi.mock("#/lib/conversation-session.server", () => ({ getConversationSession: vi.fn() }));

import { fetchAuthQuery } from "#/lib/auth-server";
import { getConversationSession } from "#/lib/conversation-session.server";
import { getFunctionName } from "convex/server";

import { getConversationForRequest } from "./get-conversation";

const state = {
  conversation: { createdAt: 0, id: "conv-1", sessionId: "sess-1", updatedAt: 0 },
  serializedMessages: [],
};

describe("getConversationForRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getConversationSession, { partial: true }).mockResolvedValue({
      data: { conversationId: "conv-other", sessionId: "sess-1" },
    });
    vi.mocked(fetchAuthQuery).mockResolvedValue(state);
  });

  it("reads the named conversation as the cookie's session, whichever one the cookie names", async () => {
    expect(await getConversationForRequest({ conversationId: "conv-1" })).toEqual(state);

    const [fn, args] = vi.mocked(fetchAuthQuery).mock.calls[0] ?? [];
    expect(fn && getFunctionName(fn)).toBe("conversations:getConversationById");
    expect(args).toEqual({ conversationId: "conv-1", sessionId: "sess-1" });
  });

  it("is null for a browser with no session, and never starts a conversation", async () => {
    vi.mocked(getConversationSession, { partial: true }).mockResolvedValue({ data: {} });

    expect(await getConversationForRequest({ conversationId: "conv-1" })).toBeNull();
    expect(fetchAuthQuery).not.toHaveBeenCalled();
  });

  it("is null for someone else's conversation", async () => {
    vi.mocked(fetchAuthQuery).mockResolvedValue(null);

    expect(await getConversationForRequest({ conversationId: "conv-9" })).toBeNull();
  });
});
