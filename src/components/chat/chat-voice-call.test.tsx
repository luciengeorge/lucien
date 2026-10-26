import type { ChatConversationState } from "#/lib/chat-types";
import type { UIMessage } from "ai";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MotionConfig } from "motion/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ChatConversation } from "./chat-conversation";

const capture = vi.fn();
vi.mock("#/lib/analytics", async (importOriginal) => ({
  ...(await importOriginal<typeof import("#/lib/analytics")>()),
  useAnalytics: () => ({ capture }),
}));

const chat: { messages: UIMessage[]; setMessages: ReturnType<typeof vi.fn>; status: "ready" | "streaming" } = {
  messages: [],
  setMessages: vi.fn(),
  status: "ready",
};
vi.mock("@ai-sdk/react", () => ({
  useChat: () => ({ ...chat, clearError: vi.fn(), regenerate: vi.fn(), sendMessage: vi.fn(), stop: vi.fn() }),
}));

const resumeOrStartConversation = vi.fn<() => Promise<ChatConversationState>>();
vi.mock("#/lib/functions/start-new-conversation", () => ({
  resumeOrStartConversation: () => resumeOrStartConversation(),
  startNewConversation: vi.fn(),
}));

const getConversation = vi.fn();
vi.mock("#/lib/functions/get-conversation", () => ({
  getConversation: (options: unknown) => getConversation(options),
}));

const waitForVoiceTranscript = vi.hoisted(() => {
  const holder: { override: (() => Promise<unknown>) | null } = { override: null };
  return holder;
});
vi.mock("./chat-voice.utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./chat-voice.utils")>();
  return {
    ...actual,
    waitForVoiceTranscript: (options: Parameters<typeof actual.waitForVoiceTranscript>[0]) =>
      waitForVoiceTranscript.override?.() ?? actual.waitForVoiceTranscript(options),
  };
});

const startVoiceCall = vi.fn();
const checkVoiceResting = vi.fn();
vi.mock("#/lib/functions/start-voice-call", () => ({
  checkVoiceResting: () => checkVoiceResting(),
  startVoiceCall: () => startVoiceCall(),
}));

const releaseVoiceCall = vi.fn();
vi.mock("#/lib/functions/release-voice-call", () => ({
  releaseVoiceCall: (options: unknown) => releaseVoiceCall(options),
}));

const settleVoiceCall = vi.fn();
vi.mock("#/lib/functions/settle-voice-call", () => ({
  settleVoiceCall: (options: unknown) => settleVoiceCall(options),
}));

const sendContactMessage = vi.fn();
vi.mock("#/lib/functions/send-contact-message", () => ({
  sendContactMessage: (options: unknown) => sendContactMessage(options),
}));

type SdkProps = {
  onConnect?: (props: { conversationId: string }) => void;
  onDisconnect?: (details: { reason: string }) => void;
  onError?: (message: string, context?: unknown) => void;
};
type SessionOptions = {
  clientTools: Record<string, () => unknown>;
  connectionType: string;
  conversationToken: string;
  dynamicVariables: Record<string, string>;
};
const sdk: {
  endSession: ReturnType<typeof vi.fn>;
  inputFrequencies: ReturnType<typeof vi.fn<() => Uint8Array>>;
  isSpeaking: boolean;
  props: SdkProps;
  sendContextualUpdate: ReturnType<typeof vi.fn>;
  startSession: ReturnType<typeof vi.fn<(options: SessionOptions) => void>>;
} = {
  endSession: vi.fn(),
  inputFrequencies: vi.fn(() => new Uint8Array(64).fill(180)),
  isSpeaking: false,
  props: {},
  sendContextualUpdate: vi.fn(),
  startSession: vi.fn<(options: SessionOptions) => void>(),
};
vi.mock("@elevenlabs/react", () => ({
  ConversationProvider: ({ children }: { children: React.ReactNode }) => children,
  useConversation: (props: SdkProps) => {
    sdk.props = props;
    return {
      endSession: sdk.endSession,
      getInputByteFrequencyData: sdk.inputFrequencies,
      getInputVolume: () => 0,
      getOutputVolume: () => 0,
      isSpeaking: sdk.isSpeaking,
      sendContextualUpdate: sdk.sendContextualUpdate,
      startSession: sdk.startSession,
    };
  },
}));

const getUserMedia = vi.fn();

const intro: UIMessage = { id: "intro", parts: [{ text: "Hi, I'm Poof", type: "text" }], role: "assistant" };
const question: UIMessage = { id: "u1", parts: [{ text: "What does he build?", type: "text" }], role: "user" };
const answer: UIMessage = { id: "a1", parts: [{ text: "AI products.", type: "text" }], role: "assistant" };
const conversation = { createdAt: 0, id: "conv-1", sessionId: "s", updatedAt: 0 };
const granted = {
  callId: "call-1",
  conversationId: "conv-1",
  maxSecs: 240,
  ok: true,
  today: "Monday, 26 October 2026",
  token: "webrtc-token",
};

function renderChat(onConversationChange = vi.fn(), { voiceResting = false } = {}) {
  const { unmount } = render(
    <QueryClientProvider client={new QueryClient()}>
      <ChatConversation
        chatState={{ conversation, serializedMessages: [], voiceResting }}
        onConversationChange={onConversationChange}
      />
    </QueryClientProvider>,
  );
  return { onConversationChange, unmount };
}

async function startCall() {
  fireEvent.click(screen.getByRole("button", { name: "Talk to Poof" }));
  await screen.findByRole("dialog", { name: "Voice call with Poof" });
}

async function connect() {
  await startCall();
  await waitFor(() => expect(sdk.startSession).toHaveBeenCalled());
  act(() => sdk.props.onConnect?.({ conversationId: "el-1" }));
}

const capturedEvents = () => capture.mock.calls.map(([event]) => event);

beforeEach(() => {
  // jsdom has no canvas; the waveform draws nothing here, and these tests only need it fed.
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  vi.stubEnv("VITE_VOICE_ENABLED", "true");
  vi.stubGlobal("navigator", { ...navigator, mediaDevices: { getUserMedia } });
  getUserMedia.mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] });
  startVoiceCall.mockResolvedValue(granted);
  resumeOrStartConversation.mockResolvedValue({ conversation, serializedMessages: [] });
  releaseVoiceCall.mockResolvedValue(null);
  checkVoiceResting.mockResolvedValue(false);
  settleVoiceCall.mockResolvedValue({ status: "settled" });
  getConversation.mockResolvedValue({ conversation, serializedMessages: [] });
  waitForVoiceTranscript.override = null;
  chat.messages = [intro];
  chat.status = "ready";
  sdk.isSpeaking = false;
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  sdk.props = {};
});

describe("voice entry", () => {
  it("is not offered while the flag is off", () => {
    vi.stubEnv("VITE_VOICE_ENABLED", "");
    renderChat();
    expect(screen.queryByRole("button", { name: "Talk to Poof" })).toBeNull();
  });

  it("sits next to send when the flag is on, and waits out a streaming reply", () => {
    chat.messages = [intro, question];
    chat.status = "streaming";
    renderChat();
    expect(screen.getByRole("button", { name: "Talk to Poof" })).toHaveProperty("disabled", true);
  });
});

describe("voice call", () => {
  it("opens at once and starts a WebRTC session with the call's token and variables", async () => {
    renderChat();
    await startCall();

    expect(screen.getByText(/processed by ElevenLabs/)).toBeTruthy();
    await waitFor(() => expect(sdk.startSession).toHaveBeenCalledTimes(1));
    const options = sdk.startSession.mock.calls[0]?.[0];
    expect(options).toMatchObject({
      connectionType: "webrtc",
      conversationToken: "webrtc-token",
      dynamicVariables: { call_id: "call-1", today: "Monday, 26 October 2026" },
    });
    expect(Object.keys(options?.clientTools ?? {})).toEqual(["show_contact_form"]);
  });

  it.each([
    ["visitor_limit", /all the talking for today/],
    ["ip_limit", /all the talking for today/],
    ["global_limit", /resting for the month/],
    ["call_active", /already open/],
    ["unavailable", /isn't available right now/],
  ])("explains a %s refusal and leads back to the chat", async (reason, copy) => {
    startVoiceCall.mockResolvedValue({ ok: false, reason });
    renderChat();
    await startCall();

    expect(await screen.findByText(copy)).toBeTruthy();
    expect(sdk.startSession).not.toHaveBeenCalled();
    expect(capture).toHaveBeenCalledWith("voice_call_refused", { reason });

    fireEvent.click(screen.getByRole("button", { name: "Back to chat" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("says how to allow the microphone, without spending a call, when it is blocked", async () => {
    getUserMedia.mockRejectedValue(new DOMException("denied", "NotAllowedError"));
    renderChat();
    await startCall();

    expect(await screen.findByText(/address bar/)).toBeTruthy();
    expect(startVoiceCall).not.toHaveBeenCalled();
  });

  it("hands Poof the typed chat once connected", async () => {
    chat.messages = [intro, question, answer];
    renderChat();
    await connect();

    expect(sdk.sendContextualUpdate).toHaveBeenCalledTimes(1);
    expect(sdk.sendContextualUpdate.mock.calls[0]?.[0]).toContain("Visitor: What does he build?\nPoof: AI products.");
    expect(capturedEvents()).toContain("voice_call_started");
  });

  it("sends nothing when the visitor has not typed anything", async () => {
    renderChat();
    await connect();

    expect(sdk.sendContextualUpdate).not.toHaveBeenCalled();
  });

  it("counts down the last thirty seconds and hangs up at zero", async () => {
    startVoiceCall.mockResolvedValue({ ...granted, maxSecs: 40 });
    renderChat();
    await startCall();
    await waitFor(() => expect(sdk.startSession).toHaveBeenCalled());
    vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] });
    act(() => sdk.props.onConnect?.({ conversationId: "el-1" }));

    act(() => vi.advanceTimersByTime(5000));
    expect(screen.queryByText(/left$/)).toBeNull();

    act(() => vi.advanceTimersByTime(10_000));
    expect(screen.getByText("0:25 left")).toBeTruthy();

    act(() => vi.advanceTimersByTime(26_000));
    expect(sdk.endSession).toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(capture).toHaveBeenCalledWith("voice_call_ended", expect.objectContaining({ ended_by: "timer" }));
  });

  it("opens the contact form when Poof calls show_contact_form, and keeps the call going", async () => {
    sendContactMessage.mockResolvedValue({ status: "sent" });
    renderChat();
    await connect();

    act(() => {
      sdk.startSession.mock.calls[0]?.[0].clientTools.show_contact_form?.();
    });
    fireEvent.change(screen.getByLabelText("Message"), { target: { value: "Let's talk about a role." } });
    fireEvent.change(screen.getByLabelText(/How to reach you/), { target: { value: "ada@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send to Lucien" }));

    expect(await screen.findByText("Message sent to Lucien")).toBeTruthy();
    expect(sendContactMessage).toHaveBeenCalledWith({
      data: { contact: "ada@example.com", message: "Let's talk about a role.", name: "" },
    });
    expect(sdk.endSession).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Voice call with Poof" })).toBeTruthy();
  });

  it("ends on Escape", async () => {
    renderChat();
    await connect();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(sdk.endSession).toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes when Poof hangs up", async () => {
    renderChat();
    await connect();

    act(() => sdk.props.onDisconnect?.({ reason: "agent" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(capture).toHaveBeenCalledWith("voice_call_ended", expect.objectContaining({ ended_by: "agent" }));
  });

  it("refetches the chat after hanging up until the call's transcript is in it", async () => {
    const said: UIMessage = {
      id: "voice-el-1-0",
      metadata: { callId: "call-1", channel: "voice" },
      parts: [{ text: "Tell me about Fyxer", type: "text" }],
      role: "user",
    };
    getConversation
      .mockResolvedValueOnce({ conversation, serializedMessages: [JSON.stringify(intro)] })
      .mockResolvedValue({ conversation, serializedMessages: [JSON.stringify(intro), JSON.stringify(said)] });
    renderChat();
    await connect();

    fireEvent.click(screen.getByRole("button", { name: "End call" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText("Saving your call…")).toBeTruthy();
    await waitFor(() => expect(chat.setMessages).toHaveBeenCalledWith([intro, said]), { timeout: 4000 });
    expect(getConversation).toHaveBeenCalledTimes(2);
    expect(getConversation).toHaveBeenCalledWith({ data: { conversationId: "conv-1" } });
    // Read-only: a blip must never start a fresh conversation and move the visitor onto it.
    expect(resumeOrStartConversation).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByText("Saving your call…")).toBeNull());
  });

  it("switches the chat to the call's conversation when it is a different one", async () => {
    const other = { ...conversation, id: "conv-2" };
    const said: UIMessage = {
      id: "voice-el-1-0",
      metadata: { callId: "call-1", channel: "voice" },
      parts: [{ text: "Hello", type: "text" }],
      role: "user",
    };
    const next = { conversation: other, serializedMessages: [JSON.stringify(said)] };
    startVoiceCall.mockResolvedValue({ ...granted, conversationId: "conv-2" });
    getConversation.mockResolvedValue(next);
    const { onConversationChange } = renderChat();
    await connect();

    fireEvent.click(screen.getByRole("button", { name: "End call" }));

    await waitFor(() => expect(onConversationChange).toHaveBeenCalledWith(next));
    expect(getConversation).toHaveBeenCalledWith({ data: { conversationId: "conv-2" } });
    expect(chat.setMessages).not.toHaveBeenCalled();
  });

  it("says so quietly when the transcript is slower than the wait", async () => {
    waitForVoiceTranscript.override = async () => ({ found: false, state: { conversation, serializedMessages: [] } });
    renderChat();
    await connect();

    fireEvent.click(screen.getByRole("button", { name: "End call" }));

    expect(await screen.findByText(/still saving/)).toBeTruthy();
    expect(screen.queryByText("Saving your call…")).toBeNull();
  });

  it("announces the connection, not every turn", async () => {
    renderChat();
    await startCall();
    const dialog = screen.getByRole("dialog", { name: "Voice call with Poof" });
    expect(within(dialog).getByRole("status").textContent).toContain("Connecting");

    await waitFor(() => expect(sdk.startSession).toHaveBeenCalled());
    act(() => sdk.props.onConnect?.({ conversationId: "el-1" }));
    expect(within(dialog).getByRole("status").textContent).toContain("Connected");
    expect(within(dialog).getByRole("status").textContent).not.toMatch(/Listening|Talking/);
  });
});

describe("voice call focus", () => {
  it("moves focus into the call, shuts the page behind it, and hands focus back to the button after", async () => {
    renderChat();
    const voiceButton = screen.getByRole("button", { name: "Talk to Poof" });
    voiceButton.focus();
    await connect();

    const dialog = screen.getByRole("dialog", { name: "Voice call with Poof" });
    expect(dialog.contains(document.activeElement)).toBe(true);
    const outside = [...document.body.children].filter((element) => !element.contains(dialog));
    expect(outside.length).toBeGreaterThan(0);
    expect(outside.every((element) => element.hasAttribute("inert"))).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "End call" }));

    expect(outside.some((element) => element.hasAttribute("inert"))).toBe(false);
    await waitFor(() => expect(document.activeElement).toBe(voiceButton));
  });

  it("moves focus into the contact form when it opens, and back to the call when it closes", async () => {
    renderChat();
    await connect();

    act(() => {
      sdk.startSession.mock.calls[0]?.[0].clientTools.show_contact_form?.();
    });
    const form = screen.getByRole("region", { name: "Write to Lucien" });
    expect(form.contains(document.activeElement)).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Close the form" }));
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "End call" }));
  });
});

describe("a call that never connects", () => {
  const released = { data: { callId: "call-1" } };

  async function connecting() {
    const view = renderChat();
    await startCall();
    await waitFor(() => expect(sdk.startSession).toHaveBeenCalled());
    return view;
  }

  it("is handed back when the connection fails", async () => {
    await connecting();
    act(() => sdk.props.onError?.("Could not connect", new Error("ice failed")));

    expect(await screen.findByText(/couldn't connect/)).toBeTruthy();
    await waitFor(() => expect(releaseVoiceCall).toHaveBeenCalledWith(released));
  });

  it("is handed back when the session cannot even start", async () => {
    sdk.startSession.mockImplementationOnce(() => {
      throw new Error("no WebRTC");
    });
    renderChat();
    await startCall();

    expect(await screen.findByText(/couldn't connect/)).toBeTruthy();
    await waitFor(() => expect(releaseVoiceCall).toHaveBeenCalledWith(released));
  });

  it.each([
    ["End call", () => fireEvent.click(screen.getByRole("button", { name: "End call" }))],
    ["Escape", () => fireEvent.keyDown(document, { key: "Escape" })],
  ])("is handed back when the visitor leaves with %s while it connects", async (_name, leave) => {
    await connecting();
    leave();

    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(() => expect(releaseVoiceCall).toHaveBeenCalledWith(released));
    expect(releaseVoiceCall).toHaveBeenCalledTimes(1);
  });

  it("is handed back when the page moves on mid-connect", async () => {
    const { unmount } = await connecting();
    unmount();

    await waitFor(() => expect(releaseVoiceCall).toHaveBeenCalledWith(released));
  });

  it("is handed back when the visitor leaves before the token even arrives", async () => {
    let grant: (value: unknown) => void = () => {};
    startVoiceCall.mockReturnValue(new Promise((resolve) => (grant = resolve)));
    renderChat();
    await startCall();

    fireEvent.click(screen.getByRole("button", { name: "End call" }));
    await act(async () => grant(granted));

    await waitFor(() => expect(releaseVoiceCall).toHaveBeenCalledWith(released));
    expect(sdk.startSession).not.toHaveBeenCalled();
  });

  it("is never handed back once it has connected", async () => {
    const { unmount } = renderChat();
    await connect();
    fireEvent.click(screen.getByRole("button", { name: "End call" }));
    unmount();

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(releaseVoiceCall).not.toHaveBeenCalled();
  });

  it("is not handed back when it was refused in the first place", async () => {
    startVoiceCall.mockResolvedValue({ ok: false, reason: "visitor_limit" });
    renderChat();
    await startCall();
    await screen.findByText(/all the talking for today/);
    fireEvent.click(screen.getByRole("button", { name: "Back to chat" }));

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(releaseVoiceCall).not.toHaveBeenCalled();
  });
});

describe("hearing the visitor", () => {
  const waveform = () => document.querySelector('[data-slot="voice-waveform"]');

  it("shows the visitor's voice under Poof only once connected, from the call's own audio", async () => {
    renderChat();
    await startCall();
    expect(waveform()).toBeNull();

    await waitFor(() => expect(sdk.startSession).toHaveBeenCalled());
    act(() => sdk.props.onConnect?.({ conversationId: "el-1" }));

    expect(waveform()).not.toBeNull();
    await waitFor(() => expect(sdk.inputFrequencies).toHaveBeenCalled());
    // The SDK's stream only: the microphone was asked for once, before the call.
    expect(getUserMedia).toHaveBeenCalledTimes(1);
  });

  it("steps aside while Poof talks", async () => {
    sdk.isSpeaking = true;
    renderChat();
    await connect();

    expect(waveform()).toBeNull();
  });

  it("is not drawn at all when motion is reduced", async () => {
    render(
      <MotionConfig reducedMotion="always">
        <QueryClientProvider client={new QueryClient()}>
          <ChatConversation chatState={{ conversation, serializedMessages: [] }} onConversationChange={vi.fn()} />
        </QueryClientProvider>
      </MotionConfig>,
    );
    await connect();

    expect(screen.getByRole("dialog", { name: "Voice call with Poof" })).toBeTruthy();
    expect(waveform()).toBeNull();
  });
});

describe("settling a call", () => {
  const settled = { data: { callId: "call-1", elevenConversationId: "el-1" } };

  it.each([
    ["the visitor hangs up", () => fireEvent.click(screen.getByRole("button", { name: "End call" }))],
    ["Poof hangs up", () => act(() => sdk.props.onDisconnect?.({ reason: "agent" }))],
    ["the line drops", () => act(() => sdk.props.onError?.("lost", new Error("lost")))],
  ])("asks the server to settle a connected call when %s, and still waits for the transcript", async (_name, end) => {
    renderChat();
    await connect();

    end();

    expect(settleVoiceCall).toHaveBeenCalledWith(settled);
    expect(settleVoiceCall).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(getConversation).toHaveBeenCalled());
  });

  it("leaves a call that never connected to the release instead", async () => {
    renderChat();
    await startCall();
    await waitFor(() => expect(sdk.startSession).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "End call" }));

    await waitFor(() => expect(releaseVoiceCall).toHaveBeenCalled());
    expect(settleVoiceCall).not.toHaveBeenCalled();
  });
});

describe("voice resting", () => {
  it("greys the button out and says why when the page loads with voice resting", async () => {
    checkVoiceResting.mockResolvedValue(true);
    renderChat(vi.fn(), { voiceResting: true });

    const button = screen.getByRole("button", { name: "Talk to Poof" });
    expect(button.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(button);
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.pointerEnter(button);
    fireEvent.mouseEnter(button);
    fireEvent.focus(button);
    expect(await screen.findByText("Voice is resting")).toBeTruthy();
  });

  it("checks before asking for the microphone, so a visitor never grants it just to be refused", async () => {
    checkVoiceResting.mockResolvedValue(true);
    renderChat();
    await startCall();

    expect(await screen.findByText("Poof's voice is resting for now. The chat still works.")).toBeTruthy();
    expect(getUserMedia).not.toHaveBeenCalled();
    expect(startVoiceCall).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Back to chat" }));
    expect(screen.getByRole("button", { name: "Talk to Poof" }).getAttribute("aria-disabled")).toBe("true");
  });

  it("un-greys the button once voice is back, without a reload", async () => {
    checkVoiceResting.mockResolvedValue(false);
    renderChat(vi.fn(), { voiceResting: true });

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Talk to Poof" }).getAttribute("aria-disabled")).toBeNull(),
    );
  });

  it("rests the button too when the server says so mid-visit", async () => {
    checkVoiceResting.mockResolvedValueOnce(false).mockResolvedValue(true);
    startVoiceCall.mockResolvedValue({ ok: false, reason: "resting" });
    renderChat();
    await startCall();

    expect(await screen.findByText(/resting for now/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Back to chat" }));
    expect(screen.getByRole("button", { name: "Talk to Poof" }).getAttribute("aria-disabled")).toBe("true");
  });
});

describe("a call that drops", () => {
  const note = "The call dropped. Anything said so far is saved below.";

  it("says so quietly in the chat when the line errors mid-call", async () => {
    renderChat();
    await connect();

    act(() => sdk.props.onDisconnect?.({ reason: "error" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText(note)).toBeTruthy();
  });

  it("says nothing when the call simply ends", async () => {
    renderChat();
    await connect();

    act(() => sdk.props.onDisconnect?.({ reason: "agent" }));

    expect(screen.queryByText(note)).toBeNull();
  });
});
