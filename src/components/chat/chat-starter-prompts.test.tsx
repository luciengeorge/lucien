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

  it("numbers the prompts 01 through 04", () => {
    render(<ChatStarterPrompts onStarterPrompt={vi.fn()} />);

    expect(STARTER_PROMPTS.length).toBe(4);
    for (const numeral of ["01", "02", "03", "04"]) {
      expect(screen.getByText(numeral)).toBeTruthy();
    }
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
