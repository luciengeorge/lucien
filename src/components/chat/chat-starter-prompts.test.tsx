import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ChatStarterPrompts } from "./chat-starter-prompts";
import { STARTER_PROMPTS } from "./chat.constants";

afterEach(() => {
  cleanup();
});

describe("ChatStarterPrompts", () => {
  it("renders every starter prompt from the constants", () => {
    render(<ChatStarterPrompts onStarterPrompt={vi.fn()} />);

    for (const prompt of STARTER_PROMPTS) {
      expect(screen.getByText(prompt)).toBeTruthy();
    }
  });

  it("files them under one label as a ruled list", () => {
    const { container } = render(<ChatStarterPrompts onStarterPrompt={vi.fn()} />);

    expect(screen.getByRole("heading", { level: 2, name: "OR ASK" })).toBeTruthy();
    expect(container.querySelectorAll("ul > li").length).toBe(STARTER_PROMPTS.length);
  });

  it("gives a question no leader, because there is no value on the right to reach", () => {
    const { container } = render(<ChatStarterPrompts onStarterPrompt={vi.fn()} />);

    expect(container.querySelector(".leader")).toBeNull();
  });

  it("makes each prompt a button that sends its text", () => {
    const onStarterPrompt = vi.fn(async () => {});
    render(<ChatStarterPrompts onStarterPrompt={onStarterPrompt} />);

    const [firstPrompt] = STARTER_PROMPTS;
    const button = screen.getByText(firstPrompt).closest("button");
    expect(button).not.toBeNull();

    fireEvent.click(screen.getByText(firstPrompt));

    expect(onStarterPrompt).toHaveBeenCalledTimes(1);
    expect(onStarterPrompt).toHaveBeenCalledWith(firstPrompt);
  });
});
