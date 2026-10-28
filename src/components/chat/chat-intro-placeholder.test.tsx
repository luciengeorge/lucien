import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ChatIntroPlaceholder } from "./chat-intro-placeholder";

afterEach(() => {
  cleanup();
});

describe("ChatIntroPlaceholder", () => {
  it("shows Poof thinking while the introduction is prepared", () => {
    const { container } = render(<ChatIntroPlaceholder withPoof />);

    expect(container.querySelector('[data-slot="poof-mark"]')?.getAttribute("data-state")).toBe("thinking");
  });

  it("says what Poof is doing beside the face, in place of its name and with no spinner", () => {
    const { container } = render(<ChatIntroPlaceholder withPoof />);

    const row = container.querySelector('[data-slot="poof-mark-box"]')?.parentElement;
    expect(row?.textContent).toContain("Preparing Lucien's introduction…");
    expect(screen.queryByText("Poof")).toBeNull();
    expect(container.querySelector("svg.animate-spin")).toBeNull();
  });

  it("leaves the face to whatever else is showing one, so two Poofs never think side by side", () => {
    const { container } = render(<ChatIntroPlaceholder withPoof={false} />);

    expect(container.querySelector('[data-slot="poof-mark"]')).toBeNull();
  });
});
