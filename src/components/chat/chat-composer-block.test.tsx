import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ChatComposerBlock } from "./chat-composer-block";

afterEach(() => {
  cleanup();
});

describe("ChatComposerBlock", () => {
  it("invites a question on the ruled line", () => {
    render(<ChatComposerBlock isBusy={false} onResumeRequest={vi.fn()} onSend={vi.fn()} />);

    expect(screen.getByPlaceholderText("Ask about the work, the resume, or how to reach him")).toBeTruthy();
  });

  it("sends what was written", async () => {
    const onSend = vi.fn(async () => {});
    render(<ChatComposerBlock isBusy={false} onResumeRequest={vi.fn()} onSend={onSend} />);

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "What did he ship this week?" } });
    fireEvent.click(screen.getByRole("button", { name: /^send$/i }));

    await waitFor(() => {
      expect(onSend).toHaveBeenCalledWith("What did he ship this week?");
    });
  });

  it("keeps the resume request reachable from the composer", () => {
    const onResumeRequest = vi.fn();
    render(<ChatComposerBlock isBusy={false} onResumeRequest={onResumeRequest} onSend={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /resume/i }));

    expect(onResumeRequest).toHaveBeenCalledTimes(1);
  });
});
