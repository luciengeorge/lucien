import type { UIMessage } from "ai";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ChatConversation } from "./chat-conversation";

const capture = vi.fn();
vi.mock("#/lib/analytics", async (importOriginal) => ({
  ...(await importOriginal<typeof import("#/lib/analytics")>()),
  useAnalytics: () => ({ capture }),
}));

const chat: {
  messages: UIMessage[];
  status: "ready" | "streaming" | "submitted";
  stop: ReturnType<typeof vi.fn>;
} = { messages: [], status: "ready", stop: vi.fn() };
vi.mock("@ai-sdk/react", () => ({
  useChat: () => ({ ...chat, clearError: vi.fn(), regenerate: vi.fn(), sendMessage: vi.fn() }),
}));

const resumeOrStartConversation = vi.fn();
vi.mock("#/lib/functions/start-new-conversation", () => ({
  resumeOrStartConversation: () => resumeOrStartConversation(),
  startNewConversation: vi.fn(),
}));

afterEach(() => {
  cleanup();
  capture.mockClear();
  resumeOrStartConversation.mockReset();
});

const user: UIMessage = { id: "u1", parts: [{ text: "What does he build?", type: "text" }], role: "user" };
const partialReply: UIMessage = { id: "a1", parts: [{ text: "He builds", type: "text" }], role: "assistant" };

function renderConversation() {
  const queryClient = new QueryClient();
  const ui = () => (
    <QueryClientProvider client={queryClient}>
      <ChatConversation
        chatState={{
          conversation: { id: "conv-1", sessionId: "s", createdAt: 0, updatedAt: 0 },
          serializedMessages: [],
        }}
        onConversationChange={vi.fn()}
      />
    </QueryClientProvider>
  );
  const result = render(ui());
  return { container: result.container, rerender: () => result.rerender(ui()) };
}

const capturedEvents = () => capture.mock.calls.map(([event]) => event);

describe("ChatConversation reply analytics", () => {
  it("records a reply that finishes as completed", () => {
    chat.messages = [user, partialReply];
    chat.status = "streaming";
    const { rerender } = renderConversation();

    chat.status = "ready";
    rerender();

    expect(capturedEvents()).toContain("chat_response_completed");
  });

  /* A stopped reply is partial: counting it as completed would inflate the completion metrics. */
  it("records a reply the visitor stopped as stopped, not completed", () => {
    chat.messages = [user, partialReply];
    chat.status = "streaming";
    const { rerender } = renderConversation();

    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    chat.status = "ready";
    rerender();

    expect(chat.stop).toHaveBeenCalled();
    expect(capturedEvents()).toContain("chat_response_stopped");
    expect(capturedEvents()).not.toContain("chat_response_completed");
  });

  /* The common case: the visitor stops while "Thinking…" shows, before any text. */
  it("records a stop before the first word, with nothing received", () => {
    chat.messages = [user];
    chat.status = "submitted";
    const { rerender } = renderConversation();

    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    chat.status = "ready";
    rerender();

    expect(capture).toHaveBeenCalledWith("chat_response_stopped", { response_length: 0, visible_message_count: 1 });
  });
});

describe("ChatConversation resume analytics", () => {
  const intro: UIMessage = { id: "intro", parts: [{ text: "Hi, I'm Poof", type: "text" }], role: "assistant" };
  const conversation = { createdAt: 0, id: "conv-9", sessionId: "s", updatedAt: 0 };

  function renderWithoutConversation() {
    chat.messages = [];
    chat.status = "ready";
    const onConversationChange = vi.fn();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <ChatConversation
          chatState={{ conversation: null, serializedMessages: [] }}
          onConversationChange={onConversationChange}
        />
      </QueryClientProvider>,
    );
    return { onConversationChange };
  }

  it("records a conversation the visitor comes back to", async () => {
    resumeOrStartConversation.mockResolvedValue({
      conversation,
      serializedMessages: [intro, user].map((message) => JSON.stringify(message)),
    });
    renderWithoutConversation();

    await waitFor(() => expect(capture).toHaveBeenCalledWith("conversation_resumed", { message_count: 2 }));
  });

  /* Every new conversation already holds the intro, so "has messages" is not "resumed". */
  it("does not count a brand new conversation as resumed", async () => {
    resumeOrStartConversation.mockResolvedValue({ conversation, serializedMessages: [JSON.stringify(intro)] });
    const { onConversationChange } = renderWithoutConversation();

    // onSuccess decides on the event before it hands the conversation over.
    await waitFor(() => expect(onConversationChange).toHaveBeenCalled());
    expect(capturedEvents()).not.toContain("conversation_resumed");
  });
});

describe("ChatConversation and Poof", () => {
  const poofMood = (container: HTMLElement) =>
    container.querySelector('[data-slot="poof-mark"]')?.getAttribute("data-mood") ?? null;

  it("celebrates a reply that finishes", () => {
    chat.messages = [user, partialReply];
    chat.status = "streaming";
    const { container, rerender } = renderConversation();

    chat.status = "ready";
    rerender();

    expect(poofMood(container)).toBe("happy");
  });

  it("does not celebrate a reply the visitor stopped", () => {
    chat.messages = [user, partialReply];
    chat.status = "streaming";
    const { container, rerender } = renderConversation();

    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    chat.status = "ready";
    rerender();

    expect(poofMood(container)).toBe("surprised");
  });
});
