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

  it("holds the finished tool card until text has started while streaming", () => {
    render(<ChatTimelineMessage message={message([resumeOutputPart()])} status="streaming" />);

    expect(screen.queryByText("resume.pdf")).toBeNull();
    expect(screen.queryByText("Download")).toBeNull();
    expect(screen.getByText("Getting Lucien's resume…")).not.toBeNull();
  });

  it("renders a labeled chip with a spinner while a tool call is input-streaming", () => {
    const { container } = render(
      <ChatTimelineMessage message={message([workLinkInputPart("input-streaming")])} status="streaming" />,
    );

    expect(screen.getByText("Finding the right work…")).not.toBeNull();
    expect(container.querySelector("svg.animate-spin")).not.toBeNull();
    expect(screen.queryByText("View")).toBeNull();
  });

  it("renders a labeled chip while a tool call is input-available", () => {
    render(<ChatTimelineMessage message={message([workLinkInputPart("input-available")])} status="streaming" />);

    expect(screen.getByText("Finding the right work…")).not.toBeNull();
  });

  it("renders the animated thinking indicator when streaming with no content yet", () => {
    const { container } = render(<ChatTimelineMessage message={message([])} status="streaming" />);

    const label = screen.getByText("Generating response…");
    expect(label.className).toContain("shimmer");
    expect(container.querySelector("svg.animate-spin")).not.toBeNull();
  });
});
