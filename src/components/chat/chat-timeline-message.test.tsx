import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MotionConfig } from "motion/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ChatMessage } from "./chat.types";

import { ChatTimelineMessage, FACE_LINGER_MS } from "./chat-timeline-message";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function textPart(text: string): ChatMessage["parts"][number] {
  return { state: "streaming", text, type: "text" };
}

function resumeOutputPart(): ChatMessage["parts"][number] {
  return {
    input: {},
    output: { filename: "resume.pdf", url: "https://example.test/resume.pdf" },
    state: "output-available",
    toolCallId: "call-resume-1",
    type: "tool-download_resume",
  };
}

function workLinkInputPart(state: "input-streaming" | "input-available"): ChatMessage["parts"][number] {
  return {
    input: state === "input-streaming" ? undefined : {},
    state,
    toolCallId: "call-work-link-1",
    type: "tool-link_work_entry",
  };
}

function reasoningPart(text: string, state: "done" | "streaming" = "done"): ChatMessage["parts"][number] {
  return { state, text, type: "reasoning" };
}

function message(parts: ChatMessage["parts"][number][]): ChatMessage {
  return { id: "msg-1", parts, role: "assistant" };
}

describe("ChatTimelineMessage render order", () => {
  it("renders text before an output-available tool card", () => {
    render(
      <ChatTimelineMessage
        message={message([textPart("Here is the file you asked for."), resumeOutputPart()])}
        status="streaming"
      />,
    );

    const textEl = screen.getByText("Here is the file you asked for.");
    const cardEl = screen.getByText("resume.pdf");

    expect(textEl.compareDocumentPosition(cardEl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("holds the finished tool card until text has started on the active streaming turn", () => {
    render(<ChatTimelineMessage isActive message={message([resumeOutputPart()])} status="streaming" />);

    expect(screen.queryByText("resume.pdf")).toBeNull();
    expect(screen.queryByText("Download")).toBeNull();
    expect(screen.getByText("Getting Lucien's resume…")).not.toBeNull();
  });

  it("renders the in-progress tool indicator as a status marker (no box) while a tool call is input-streaming on the active turn", () => {
    const { container } = render(
      <ChatTimelineMessage isActive message={message([workLinkInputPart("input-streaming")])} status="streaming" />,
    );

    const label = screen.getByText("Finding the right work…");
    expect(label.getAttribute("data-slot")).toBe("shimmering-text");
    expect(container.querySelector("svg.animate-spin")).toBeNull();
    expect(container.querySelector('[data-slot="attachment"]')).toBeNull();
    expect(screen.queryByText("View")).toBeNull();
  });

  it("renders the in-progress tool indicator as a status marker (no box) while a tool call is input-available on the active turn", () => {
    const { container } = render(
      <ChatTimelineMessage isActive message={message([workLinkInputPart("input-available")])} status="streaming" />,
    );

    expect(screen.getByText("Finding the right work…")).not.toBeNull();
    expect(container.querySelector('[data-slot="attachment"]')).toBeNull();
  });

  it("renders the animated thinking indicator when streaming with no content yet on the active turn", () => {
    const { container } = render(<ChatTimelineMessage isActive message={message([])} status="streaming" />);

    const label = screen.getByText("Generating response…");
    expect(label.getAttribute("data-slot")).toBe("shimmering-text");
    expect(container.querySelector("svg.animate-spin")).toBeNull();
  });

  it("regression: a past (non-active) tool-only turn keeps showing its card during a new global stream, not a chip", () => {
    // chat-conversation.tsx passes the SAME global `status` to every rendered message. A past,
    // already-settled turn (a tool card with no text) must not re-hide its card or show an
    // in-progress chip just because the user started a new message and the global status flipped
    // back to "streaming" for the newest turn.
    render(<ChatTimelineMessage isActive={false} message={message([resumeOutputPart()])} status="streaming" />);

    expect(screen.getByText("resume.pdf")).not.toBeNull();
    expect(screen.getByText("Download")).not.toBeNull();
    expect(screen.queryByText("Getting Lucien's resume…")).toBeNull();
  });
});

describe("ChatTimelineMessage Poof mark", () => {
  function markState(container: HTMLElement): string | null {
    return container.querySelector('[data-slot="poof-mark"]')?.getAttribute("data-state") ?? null;
  }

  it("shows Poof writing while the live turn streams text", () => {
    const { container } = render(
      <ChatTimelineMessage isActive message={message([textPart("Lucien is")])} status="streaming" />,
    );

    expect(markState(container)).toBe("writing");
  });

  it("shows Poof working while a tool call is in flight", () => {
    const { container } = render(
      <ChatTimelineMessage isActive message={message([workLinkInputPart("input-available")])} status="streaming" />,
    );

    expect(markState(container)).toBe("working");
  });

  it("regression: keeps working, in step with the chip, after the tool resolves but before text starts", () => {
    // The chip below keys off "tool finished but its card is still held back", not just "tool
    // pending". If the face keys off pending alone it drops to thinking while the chip still says
    // "Getting Lucien's resume…", which reads as two different stories about the same moment.
    const { container } = render(
      <ChatTimelineMessage isActive message={message([resumeOutputPart()])} status="streaming" />,
    );

    expect(screen.getByText("Getting Lucien's resume…")).not.toBeNull();
    expect(markState(container)).toBe("working");
  });

  it("renders the mark already visible, since it replaces the pending-reply mark in the same spot", () => {
    // The pending reply and the timeline message are different React subtrees, so the face is a
    // second instance. If it played the mount fade the handoff blinked for a frame or two.
    const { container } = render(<ChatTimelineMessage isActive message={message([])} status="streaming" />);

    const svg = container.querySelector('[data-slot="poof-mark"]');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("style") ?? "").not.toContain("opacity: 0");
  });

  it("shows no face on an answer that was already finished when it appeared, like the intro", () => {
    const { container } = render(
      <ChatTimelineMessage isActive message={message([textPart("Lucien is a product engineer.")])} status="ready" />,
    );

    expect(markState(container)).toBeNull();
  });

  it("keeps the face beside a reply that just finished long enough to react, then lets it go", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const reply = message([textPart("He shipped it in a week.")]);
    const ui = (status: "ready" | "streaming", metadata?: unknown) => (
      <MotionConfig reducedMotion="always">
        <ChatTimelineMessage isActive message={{ ...reply, metadata }} status={status} />
      </MotionConfig>
    );
    const { container, rerender } = render(ui("streaming"));

    rerender(ui("ready", { mood: "proud" }));
    expect(markState(container)).toBe("idle");
    expect(container.querySelector('[data-slot="poof-mark"]')?.getAttribute("data-feeling")).toBe("proud");

    act(() => vi.advanceTimersByTime(FACE_LINGER_MS - 100));
    expect(markState(container)).toBe("idle");

    act(() => vi.advanceTimersByTime(200));
    vi.useRealTimers();
    await waitFor(() => expect(markState(container)).toBeNull());
    expect(screen.getByText("He shipped it in a week.")).not.toBeNull();
  });

  it("lets the face go at once when the next question takes over", async () => {
    const reply = message([textPart("He shipped it in a week.")]);
    const ui = (isActive: boolean, status: "ready" | "streaming") => (
      <MotionConfig reducedMotion="always">
        <ChatTimelineMessage isActive={isActive} message={reply} status={status} />
      </MotionConfig>
    );
    const { container, rerender } = render(ui(true, "streaming"));

    rerender(ui(true, "ready"));
    rerender(ui(false, "submitted"));

    await waitFor(() => expect(markState(container)).toBeNull());
  });

  it("shows Poof confused when the latest answer broke off with an error", () => {
    const { container } = render(
      <ChatTimelineMessage isActive message={message([textPart("Lucien is")])} status="error" />,
    );

    expect(markState(container)).toBe("confused");
  });

  it("never marks a past turn, even while the global status is streaming for a newer one", () => {
    const { container } = render(
      <ChatTimelineMessage isActive={false} message={message([textPart("An older answer.")])} status="streaming" />,
    );

    expect(markState(container)).toBeNull();
  });

  it("never marks a user turn", () => {
    const { container } = render(
      <ChatTimelineMessage
        isActive
        message={{ id: "msg-user", parts: [textPart("Who is Lucien?")], role: "user" }}
        status="streaming"
      />,
    );

    expect(markState(container)).toBeNull();
  });
});

describe("ChatTimelineMessage reasoning", () => {
  it("does not render a Thinking header for a reasoning part with no text", () => {
    // gpt-5.6-luna emits a reasoning part whose text is empty. A header over nothing looks like
    // a stuck status, and it stays on screen after the answer has finished.
    render(
      <ChatTimelineMessage isActive message={message([reasoningPart(""), textPart("Lucien is")])} status="ready" />,
    );

    expect(screen.queryByText("Thinking")).toBeNull();
    expect(screen.queryByText("Thought")).toBeNull();
  });

  it("shows Poof's thinking, open, while it reasons", () => {
    render(
      <ChatTimelineMessage
        isActive
        message={message([reasoningPart("Checking which role is most recent.", "streaming")])}
        status="streaming"
      />,
    );

    expect(screen.getByRole("button", { name: "Thinking" }).getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("Checking which role is most recent.")).not.toBeNull();
  });

  it("folds the thinking away once it is done, one click from reopening", () => {
    render(
      <ChatTimelineMessage
        isActive
        message={message([reasoningPart("Checking which role is most recent."), textPart("Lucien is")])}
        status="ready"
      />,
    );

    const trigger = screen.getByRole("button", { name: "Thought" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText("Checking which role is most recent.")).toBeNull();

    fireEvent.click(trigger);
    expect(screen.getByText("Checking which role is most recent.")).not.toBeNull();
  });
});

describe("ChatTimelineMessage user text", () => {
  /* Visitors type plain text: markdown would eat `*`, `#` and Shift+Enter line breaks. */
  it("shows exactly what the visitor typed, line breaks included", () => {
    const { container } = render(
      <ChatTimelineMessage
        message={{ id: "msg-u", parts: [textPart("*not bold*\n# not a heading")], role: "user" }}
        status="ready"
      />,
    );

    const text = screen.getByText(/\*not bold\*/);
    expect(text.textContent).toBe("*not bold*\n# not a heading");
    expect(text.className).toContain("whitespace-pre-wrap");
    expect(container.querySelector("em, h1")).toBeNull();
  });
});

describe("ChatTimelineMessage stopped replies", () => {
  it("never shows a past turn generating, even while a newer reply streams", () => {
    // A reply stopped before its first word is an empty assistant turn. Every message gets the
    // same global status, so without the active check it read "Generating response…" again the
    // moment the next reply started streaming.
    render(<ChatTimelineMessage isActive={false} message={message([])} status="streaming" />);

    expect(screen.queryByText("Generating response…")).toBeNull();
  });

  it("marks a reply stopped before its first word as stopped, not as Poof failing to understand", () => {
    render(<ChatTimelineMessage isActive={false} message={message([])} status="ready" wasStopped />);

    expect(screen.getByText("Stopped")).not.toBeNull();
    expect(screen.queryByText(/didn't catch that/)).toBeNull();
  });

  it("keeps what a stopped reply had written, marked as stopped", () => {
    render(<ChatTimelineMessage isActive message={message([textPart("Lucien is")])} status="ready" wasStopped />);

    expect(screen.getByText("Lucien is")).not.toBeNull();
    expect(screen.getByText("Stopped")).not.toBeNull();
  });

  it("does not mark a reply that finished on its own", () => {
    render(<ChatTimelineMessage isActive message={message([textPart("Lucien is")])} status="ready" />);

    expect(screen.queryByText("Stopped")).toBeNull();
  });
});

describe("ChatTimelineMessage voice turns", () => {
  const voiceMetadata = { callId: "call-1", channel: "voice" };

  it("marks a turn said on a call, from either side", () => {
    for (const role of ["user", "assistant"] as const) {
      render(
        <ChatTimelineMessage
          isActive={false}
          message={{ id: `voice-${role}`, metadata: voiceMetadata, parts: [textPart("Hello there")], role }}
          status="ready"
        />,
      );
      expect(screen.getByText("Hello there")).toBeTruthy();
      expect(screen.getByText("Voice")).toBeTruthy();
      cleanup();
    }
  });

  it("shows a voice turn saved with an audio tag without it, and leaves typed text alone", () => {
    render(
      <ChatTimelineMessage
        isActive={false}
        message={{
          id: "old-voice",
          metadata: voiceMetadata,
          parts: [textPart("[thoughtful] He studied at McGill.")],
          role: "assistant",
        }}
        status="ready"
      />,
    );
    expect(screen.getByText("He studied at McGill.")).toBeTruthy();
    cleanup();
    render(
      <ChatTimelineMessage isActive={false} message={message([textPart("Typed [thoughtful] text")])} status="ready" />,
    );
    expect(screen.getByText("Typed [thoughtful] text")).toBeTruthy();
  });

  it("leaves typed turns unmarked", () => {
    render(<ChatTimelineMessage isActive={false} message={message([textPart("Typed")])} status="ready" />);
    expect(screen.queryByText("Voice")).toBeNull();
  });
});

describe("ChatTimelineMessage mood", () => {
  function face(container: HTMLElement) {
    return container.querySelector('[data-slot="poof-mark"]');
  }

  it("puts the reply's mood on Poof's face as the reply arrives", () => {
    const { container } = render(
      <ChatTimelineMessage
        isActive
        message={{ ...message([textPart("He shipped it in a week.")]), metadata: { mood: "proud" } }}
        status="streaming"
      />,
    );
    expect(face(container)?.getAttribute("data-feeling")).toBe("proud");
  });

  it("leaves the face neutral for a reply with no mood", () => {
    const reply = message([textPart("Hi.")]);
    const { container, rerender } = render(<ChatTimelineMessage isActive message={reply} status="streaming" />);

    rerender(<ChatTimelineMessage isActive message={{ ...reply, metadata: { model: "x" } }} status="ready" />);
    expect(face(container)?.getAttribute("data-feeling")).toBe("neutral");
  });
});

describe("Poof's live status sits next to its face", () => {
  const header = (container: HTMLElement) => {
    const mark = container.querySelector('[data-slot="poof-mark-box"]');
    const row = mark?.parentElement;
    if (!row) throw new Error("Poof's face is not on screen");
    return row;
  };

  it("shows what Poof is doing beside the face, in place of its name and with no spinner", () => {
    const { container } = render(<ChatTimelineMessage isActive message={message([])} status="streaming" />);

    expect(header(container).textContent).toContain("Generating response…");
    expect(screen.queryByText("Poof")).toBeNull();
    expect(container.querySelector("svg.animate-spin")).toBeNull();
  });

  it("puts a tool's progress beside the face too", () => {
    const { container } = render(
      <ChatTimelineMessage isActive message={message([workLinkInputPart("input-streaming")])} status="streaming" />,
    );

    expect(header(container).textContent).toContain("Finding the right work…");
    expect(container.querySelector("svg.animate-spin")).toBeNull();
  });

  it("leaves the face alone once the answer is being written", () => {
    const { container } = render(
      <ChatTimelineMessage
        isActive
        message={message([{ text: "He builds things.", type: "text" }])}
        status="streaming"
      />,
    );

    expect(header(container).textContent?.trim()).toBe("");
  });

  it("shows only the latest tool's progress when several are on the go", () => {
    const { container } = render(
      <ChatTimelineMessage
        isActive
        message={message([resumeOutputPart(), workLinkInputPart("input-streaming")])}
        status="streaming"
      />,
    );

    expect(header(container).textContent).toContain("Finding the right work…");
    expect(screen.queryByText("Getting Lucien's resume…")).toBeNull();
  });
});

describe("ChatTimelineMessage bubbles", () => {
  const bubbleOf = (text: string) => {
    const bubble = screen.getByText(text).closest('[data-slot="chat-bubble"]');
    if (!bubble) throw new Error(`"${text}" is not in a bubble`);
    return bubble;
  };
  const columnOf = (element: Element) => element.closest("[data-speaker]");
  const follows = (first: Element, second: Element) =>
    Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);
  const userMessage = (text: string, metadata?: unknown): ChatMessage => ({
    id: "msg-user",
    metadata,
    parts: [textPart(text)],
    role: "user",
  });

  it("puts the visitor's words in a brand-green bubble on the right", () => {
    render(<ChatTimelineMessage isActive={false} message={userMessage("Who is Lucien?")} status="ready" />);

    const bubble = bubbleOf("Who is Lucien?");
    expect(bubble.className).toContain("bg-primary");
    expect(bubble.className).toContain("text-white");
    expect(columnOf(bubble)?.className).toContain("items-end");
  });

  it("puts Poof's words in a soft grey bubble on the left", () => {
    render(<ChatTimelineMessage isActive={false} message={message([textPart("He builds things.")])} status="ready" />);

    const bubble = bubbleOf("He builds things.");
    expect(bubble.className).toContain("bg-neutral-100");
    expect(columnOf(bubble)?.className).toContain("items-start");
  });

  it("shows no speaker labels, but still tells screen readers who said what", () => {
    render(
      <>
        <ChatTimelineMessage isActive={false} message={userMessage("Who is Lucien?")} status="ready" />
        <ChatTimelineMessage isActive={false} message={message([textPart("He builds things.")])} status="ready" />
      </>,
    );

    expect(screen.queryByText("Poof")).toBeNull();
    expect(screen.queryByText("You")).toBeNull();
    expect(screen.getByText("You said").className).toContain("sr-only");
    expect(screen.getByText("Poof said").className).toContain("sr-only");
  });

  it("hangs tool cards under Poof's bubble, in its column but outside the bubble", () => {
    render(
      <ChatTimelineMessage
        isActive={false}
        message={message([textPart("Here is the file."), resumeOutputPart()])}
        status="ready"
      />,
    );

    const bubble = bubbleOf("Here is the file.");
    const card = screen.getByText("resume.pdf");
    expect(bubble.contains(card)).toBe(false);
    expect(columnOf(bubble)?.contains(card)).toBe(true);
    expect(follows(bubble, card)).toBe(true);
  });

  it("marks a call turn under its bubble, on the speaker's side", () => {
    render(
      <ChatTimelineMessage
        isActive={false}
        message={userMessage("Tell me about Fyxer", { callId: "call-1", channel: "voice" })}
        status="ready"
      />,
    );

    const bubble = bubbleOf("Tell me about Fyxer");
    const marker = screen.getByText("Voice");
    expect(bubble.contains(marker)).toBe(false);
    expect(columnOf(bubble)?.contains(marker)).toBe(true);
    expect(follows(bubble, marker)).toBe(true);
  });

  it("notes a stopped reply in small quiet type under what it had written", () => {
    render(<ChatTimelineMessage isActive message={message([textPart("Lucien is")])} status="ready" wasStopped />);

    const bubble = bubbleOf("Lucien is");
    const note = screen.getByText("Stopped");
    expect(bubble.contains(note)).toBe(false);
    expect(follows(bubble, note)).toBe(true);
    expect(note.className).toContain("text-xs");
    expect(note.className).not.toContain("uppercase");
  });

  it("says it didn't catch that in Poof's own bubble", () => {
    render(<ChatTimelineMessage isActive={false} message={message([])} status="ready" />);

    expect(bubbleOf("Sorry, I didn't catch that. Mind rephrasing?").className).toContain("bg-neutral-100");
  });
});
