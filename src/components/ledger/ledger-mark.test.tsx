import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { LedgerMark } from "./ledger-mark";

afterEach(() => {
  cleanup();
});

describe("LedgerMark", () => {
  it("draws the mark", () => {
    const { container } = render(<LedgerMark />);

    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg?.querySelectorAll("path").length).toBeGreaterThan(0);
  });

  it("stays out of the accessibility tree, because the wordmark beside it is the name", () => {
    const { container } = render(<LedgerMark />);

    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("takes its colour from the text around it, so it can sit on ink or on paper", () => {
    const { container } = render(<LedgerMark />);

    for (const path of container.querySelectorAll("path")) {
      expect(path.getAttribute("fill")).toBe("currentColor");
    }
  });
});
