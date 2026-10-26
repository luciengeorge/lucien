import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ChatConversation } from "./chat-conversation";

vi.mock("#/lib/analytics", async (importOriginal) => ({
  ...(await importOriginal<typeof import("#/lib/analytics")>()),
  useAnalytics: () => ({ capture: vi.fn() }),
}));
vi.mock("@ai-sdk/react", () => ({
  useChat: () => ({
    clearError: vi.fn(),
    messages: [],
    regenerate: vi.fn(),
    sendMessage: vi.fn(),
    setMessages: vi.fn(),
    status: "ready",
    stop: vi.fn(),
  }),
}));
vi.mock("#/lib/functions/start-new-conversation", () => ({
  resumeOrStartConversation: vi.fn(),
  startNewConversation: vi.fn(),
}));
const releaseVoiceCall = vi.fn();
vi.mock("#/lib/functions/release-voice-call", () => ({
  releaseVoiceCall: (options: unknown) => releaseVoiceCall(options),
}));
vi.mock("#/lib/functions/start-voice-call", () => ({
  startVoiceCall: async () => ({
    callId: "call-1",
    conversationId: "conv-1",
    maxSecs: 240,
    ok: true,
    today: "Monday, 26 October 2026",
    token: "webrtc-token",
  }),
}));
// What a stale chunk after a deploy looks like: the call's code is gone from the server.
vi.mock("./chat-voice-call", () => {
  throw new Error("Failed to fetch dynamically imported module");
});

beforeEach(() => {
  vi.stubEnv("VITE_VOICE_ENABLED", "true");
  vi.stubGlobal("navigator", {
    ...navigator,
    mediaDevices: { getUserMedia: async () => ({ getTracks: () => [{ stop: vi.fn() }] }) },
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("voice call that fails to load", () => {
  it("leaves the chat standing, says the call couldn't connect, and hands the call back", async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <ChatConversation
          chatState={{ conversation: { createdAt: 0, id: "conv-1", updatedAt: 0 }, serializedMessages: [] }}
          onConversationChange={vi.fn()}
        />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Talk to Poof" }));

    expect(await screen.findByText(/couldn't connect/)).toBeTruthy();
    await waitFor(() => expect(releaseVoiceCall).toHaveBeenCalledWith({ data: { callId: "call-1" } }));

    fireEvent.click(screen.getByRole("button", { name: "Back to chat" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: "Talk to Poof" })).toBeTruthy();
  });
});
