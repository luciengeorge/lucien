import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./auth-server", () => ({
  fetchAuthAction: vi.fn(),
  fetchAuthMutation: vi.fn(),
  fetchAuthQuery: vi.fn(),
}));

import { fetchAuthAction, fetchAuthMutation, fetchAuthQuery } from "./auth-server";
import { HOMEPAGE_INTRO_FALLBACK } from "./chat-intro";
import { createConversationWithIntro } from "./conversation-intro.server";

function storedIntroText(): string | undefined {
  const call = vi
    .mocked(fetchAuthMutation)
    .mock.calls.find(([, args]) => typeof args === "object" && args !== null && "messageJson" in args);
  const args = call?.[1];
  if (!args || typeof args !== "object" || !("messageJson" in args) || typeof args.messageJson !== "string") return;
  return JSON.parse(args.messageJson).parts[0].text;
}

describe("createConversationWithIntro", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchAuthMutation).mockResolvedValue("conv-1");
    vi.mocked(fetchAuthQuery).mockResolvedValue({
      conversation: { createdAt: 0, id: "conv-1", sessionId: "s", updatedAt: 0 },
      serializedMessages: [],
    });
  });

  it("opens with the cached intro", async () => {
    vi.mocked(fetchAuthAction).mockResolvedValue("Hi, I'm Poof.");

    await createConversationWithIntro("s", "corr");

    expect(storedIntroText()).toBe("Hi, I'm Poof.");
  });

  it("opens with the static intro before any intro has been generated", async () => {
    vi.mocked(fetchAuthAction).mockResolvedValue(null);

    await createConversationWithIntro("s", "corr");

    expect(storedIntroText()).toBe(HOMEPAGE_INTRO_FALLBACK);
  });
});
