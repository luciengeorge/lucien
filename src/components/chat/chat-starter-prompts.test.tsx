import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ChatStarterPrompts } from "./chat-starter-prompts";

afterEach(() => {
  cleanup();
});

describe("ChatStarterPrompts", () => {
  it("shows short chips but asks the full question", () => {
    const onStarterPrompt = vi.fn().mockResolvedValue(undefined);
    render(<ChatStarterPrompts onStarterPrompt={onStarterPrompt} />);

    fireEvent.click(screen.getByRole("button", { name: "His resume" }));
    expect(onStarterPrompt).toHaveBeenCalledWith("Can I see Lucien's resume?");
  });

  it("still names the section for screen readers and the page outline", () => {
    render(<ChatStarterPrompts onStarterPrompt={vi.fn()} />);

    expect(screen.getByRole("heading", { level: 2, name: "Start here" })).not.toBeNull();
  });
});
