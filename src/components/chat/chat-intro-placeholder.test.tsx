import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ChatIntroPlaceholder } from "./chat-intro-placeholder";

afterEach(() => {
  cleanup();
});

describe("ChatIntroPlaceholder", () => {
  it("shows Poof thinking while the introduction is prepared", () => {
    const { container } = render(<ChatIntroPlaceholder />);

    expect(container.querySelector('[data-slot="poof-mark"]')?.getAttribute("data-state")).toBe("thinking");
  });
});
