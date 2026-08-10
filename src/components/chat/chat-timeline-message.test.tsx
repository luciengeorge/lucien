import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { ChatMessage } from "./chat.types";

import { ChatTimelineMessage } from "./chat-timeline-message";

afterEach(() => {
  cleanup();
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

function message(parts: ChatMessage["parts"][number][]): ChatMessage {
  return { id: "msg-1", parts, role: "assistant" };
}

function userMessage(parts: ChatMessage["parts"][number][]): ChatMessage {
  return { id: "msg-user-1", parts, role: "user" };
}

describe("ChatTimelineMessage attribution", () => {
  it("attributes an assistant reply to Lucien, because Poof answers as him", () => {
    render(
      <ChatTimelineMessage
        entryIndex={0}
        isActive={false}
        message={message([textPart("He ships daily.")])}
        status="ready"
      />,
    );

    expect(screen.getByText("LUCIEN")).toBeTruthy();
    expect(screen.getByText("He ships daily.")).toBeTruthy();
  });

  it("labels a user turn as yours, and numbers it in the transcript", () => {
    render(
      <ChatTimelineMessage
        entryIndex={1}
        isActive={false}
        message={userMessage([textPart("What does he build?")])}
        status="ready"
      />,
    );

    expect(screen.getByText("YOU")).toBeTruthy();
    expect(screen.getByText("ENTRY 02")).toBeTruthy();
    expect(screen.queryByText("LUCIEN")).toBeNull();
    expect(screen.getByText("What does he build?")).toBeTruthy();
  });

  it("keeps the two voices apart: his reply in the sans, your question in mono", () => {
    const { container: reply } = render(
      <ChatTimelineMessage
        entryIndex={0}
        isActive={false}
        message={message([textPart("He ships daily.")])}
        status="ready"
      />,
    );
    const replyProse = reply.querySelector("[data-slot='turn-prose']");
    expect(replyProse?.className).toContain("font-sans");

    const { container: question } = render(
      <ChatTimelineMessage
        entryIndex={1}
        isActive={false}
        message={userMessage([textPart("What does he build?")])}
        status="ready"
      />,
    );
    const questionProse = question.querySelector("[data-slot='turn-prose']");
    expect(questionProse?.className).toContain("font-mono");
    expect(questionProse?.className).not.toContain("italic");
  });
});

describe("ChatTimelineMessage render order", () => {
  it("renders text before an output-available tool card", () => {
    render(
      <ChatTimelineMessage
        message={message([textPart("Here is the file you asked for."), resumeOutputPart()])}
        status="streaming"
      />,
    );

    const textEl = screen.getByText("Here is the file you asked for.");
    const cardEl = screen.getByText("RESUME");

    expect(textEl.compareDocumentPosition(cardEl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("holds the finished tool card until text has started on the active streaming turn", () => {
    render(<ChatTimelineMessage entryIndex={0} isActive message={message([resumeOutputPart()])} status="streaming" />);

    expect(screen.queryByText("RESUME")).toBeNull();
    expect(screen.queryByText("DOWNLOAD")).toBeNull();
    expect(screen.getByText("Getting Lucien's resume…")).not.toBeNull();
  });

  it("renders the in-progress tool indicator as a status marker (no box) while a tool call is input-streaming on the active turn", () => {
    const { container } = render(
      <ChatTimelineMessage
        entryIndex={0}
        isActive
        message={message([workLinkInputPart("input-streaming")])}
        status="streaming"
      />,
    );

    const label = screen.getByText("Finding the right work…");
    expect(label.getAttribute("data-slot")).toBe("shimmering-text");
    expect(container.querySelector("svg.animate-spin")).not.toBeNull();
    expect(container.querySelector('[data-slot="attachment"]')).toBeNull();
    expect(screen.queryByText("OPEN")).toBeNull();
  });

  it("renders the in-progress tool indicator as a status marker (no box) while a tool call is input-available on the active turn", () => {
    const { container } = render(
      <ChatTimelineMessage
        entryIndex={0}
        isActive
        message={message([workLinkInputPart("input-available")])}
        status="streaming"
      />,
    );

    expect(screen.getByText("Finding the right work…")).not.toBeNull();
    expect(container.querySelector('[data-slot="attachment"]')).toBeNull();
  });

  it("renders the animated thinking indicator when streaming with no content yet on the active turn", () => {
    const { container } = render(
      <ChatTimelineMessage entryIndex={0} isActive message={message([])} status="streaming" />,
    );

    const label = screen.getByText("Generating response…");
    expect(label.getAttribute("data-slot")).toBe("shimmering-text");
    expect(container.querySelector("svg.animate-spin")).not.toBeNull();
  });

  it("regression: a past (non-active) tool-only turn keeps showing its card during a new global stream, not a chip", () => {
    // chat-conversation.tsx passes the SAME global `status` to every rendered message. A past,
    // already-settled turn (a tool card with no text) must not re-hide its card or show an
    // in-progress chip just because the user started a new message and the global status flipped
    // back to "streaming" for the newest turn.
    render(
      <ChatTimelineMessage
        entryIndex={0}
        isActive={false}
        message={message([resumeOutputPart()])}
        status="streaming"
      />,
    );

    expect(screen.getByText("RESUME")).not.toBeNull();
    expect(screen.getByText("DOWNLOAD")).not.toBeNull();
    expect(screen.queryByText("Getting Lucien's resume…")).toBeNull();
  });
});
