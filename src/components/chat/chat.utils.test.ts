import { describe, expect, it, vi } from "vitest";

import type { ChatMessage } from "./chat.types";

import {
  createRateLimitAwareFetch,
  entryItemClassName,
  getContactSubmissionStatus,
  getInvokedToolNames,
  getSettledAssistantAnalyticsEvents,
  isEmptyAssistantTurn,
  transcriptCountLabel,
} from "./chat.utils";

function textPart(text: string): ChatMessage["parts"][number] {
  return { state: "done", text, type: "text" };
}

function toolPart(
  type: `tool-${string}`,
  overrides: { output?: unknown; state?: "input-available" | "output-available" } = {},
): ChatMessage["parts"][number] {
  if ((overrides.state ?? "output-available") === "input-available") {
    return { input: {}, state: "input-available", toolCallId: "call-1", type };
  }
  return { input: {}, output: overrides.output, state: "output-available", toolCallId: "call-1", type };
}

describe("entryItemClassName", () => {
  it("still applies the border only to non-first entries", () => {
    expect(entryItemClassName(true)).not.toContain("border-t");
    expect(entryItemClassName(false)).toContain("border-t");
  });
});

describe("getInvokedToolNames", () => {
  it("returns the tool name for a tool part", () => {
    expect(getInvokedToolNames([toolPart("tool-download_resume")])).toEqual(["download_resume"]);
  });

  it("returns a name per distinct tool part, ignoring non-tool parts", () => {
    expect(
      getInvokedToolNames([textPart("hello"), toolPart("tool-download_resume"), toolPart("tool-link_work_entry")]),
    ).toEqual(["download_resume", "link_work_entry"]);
  });

  it("returns an empty array when there are no tool parts", () => {
    expect(getInvokedToolNames([textPart("hello")])).toEqual([]);
  });
});

describe("getContactSubmissionStatus", () => {
  it("returns 'sent' when the contact tool output-available part reports sent", () => {
    expect(getContactSubmissionStatus([toolPart("tool-contact_lucien", { output: { status: "sent" } })])).toBe("sent");
  });

  it("returns 'failed' when the contact tool output-available part reports failed", () => {
    expect(getContactSubmissionStatus([toolPart("tool-contact_lucien", { output: { status: "failed" } })])).toBe(
      "failed",
    );
  });

  it("returns undefined when there is no contact tool part", () => {
    expect(getContactSubmissionStatus([toolPart("tool-download_resume", { output: {} })])).toBeUndefined();
  });

  it("returns undefined when the contact tool part has not resolved to output-available", () => {
    expect(
      getContactSubmissionStatus([toolPart("tool-contact_lucien", { state: "input-available", output: undefined })]),
    ).toBeUndefined();
  });

  it("returns undefined when the output shape is unexpected", () => {
    expect(
      getContactSubmissionStatus([toolPart("tool-contact_lucien", { output: { status: "unknown" } })]),
    ).toBeUndefined();
  });
});

describe("isEmptyAssistantTurn", () => {
  it("is true when there is no text and no tool part", () => {
    expect(isEmptyAssistantTurn([])).toBe(true);
  });

  it("is false when there is non-empty text", () => {
    expect(isEmptyAssistantTurn([textPart("hi")])).toBe(false);
  });

  it("is false when there is a tool part, even with empty text", () => {
    expect(isEmptyAssistantTurn([textPart(""), toolPart("tool-download_resume")])).toBe(false);
  });

  it("is true when the only text part is empty", () => {
    expect(isEmptyAssistantTurn([textPart("")])).toBe(true);
  });
});

describe("getSettledAssistantAnalyticsEvents", () => {
  it("emits chat_tool_invoked with only the tool name for each invoked tool", () => {
    const events = getSettledAssistantAnalyticsEvents([textPart("Here you go."), toolPart("tool-download_resume")]);

    const toolInvoked = events.filter((e) => e.event === "chat_tool_invoked");
    expect(toolInvoked).toEqual([{ event: "chat_tool_invoked", properties: { tool: "download_resume" } }]);
  });

  it("emits contact_submitted with only the status when the contact tool resolved", () => {
    const events = getSettledAssistantAnalyticsEvents([
      toolPart("tool-contact_lucien", { output: { status: "sent" } }),
    ]);

    expect(events).toContainEqual({ event: "contact_submitted", properties: { status: "sent" } });
  });

  it("emits chat_response_empty_rendered with no properties when the turn is empty", () => {
    const events = getSettledAssistantAnalyticsEvents([]);

    expect(events).toEqual([{ event: "chat_response_empty_rendered", properties: {} }]);
  });

  it("emits nothing for a plain settled text response with no tools", () => {
    expect(getSettledAssistantAnalyticsEvents([textPart("All good.")])).toEqual([]);
  });

  it("never includes raw message text in any emitted event's properties", () => {
    const events = getSettledAssistantAnalyticsEvents([
      textPart("some private visitor message content"),
      toolPart("tool-contact_lucien", { output: { status: "failed" } }),
    ]);

    for (const { properties } of events) {
      for (const value of Object.values(properties)) {
        expect(String(value)).not.toContain("private visitor message");
      }
    }
  });
});

describe("createRateLimitAwareFetch", () => {
  it("calls onRateLimited when the response status is 429", async () => {
    const onRateLimited = vi.fn();
    const baseFetch = vi.fn().mockResolvedValue(new Response(null, { status: 429 }));
    const rateLimitAwareFetch = createRateLimitAwareFetch(baseFetch, onRateLimited);

    const response = await rateLimitAwareFetch("/api/chat");

    expect(onRateLimited).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(429);
  });

  it("does not call onRateLimited for a non-429 response", async () => {
    const onRateLimited = vi.fn();
    const baseFetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    const rateLimitAwareFetch = createRateLimitAwareFetch(baseFetch, onRateLimited);

    await rateLimitAwareFetch("/api/chat");

    expect(onRateLimited).not.toHaveBeenCalled();
  });
});

describe("transcriptCountLabel", () => {
  it("counts a single entry in the singular", () => {
    expect(transcriptCountLabel(1)).toBe("01 ENTRY");
  });

  it("zero-pads and pluralises everything else", () => {
    expect(transcriptCountLabel(0)).toBe("00 ENTRIES");
    expect(transcriptCountLabel(5)).toBe("05 ENTRIES");
    expect(transcriptCountLabel(12)).toBe("12 ENTRIES");
  });
});
