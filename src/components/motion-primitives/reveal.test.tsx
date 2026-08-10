import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Reveal, RevealGroup, RevealItem } from "./reveal";

afterEach(() => {
  cleanup();
});

describe("Reveal", () => {
  it("renders its children", () => {
    render(<Reveal>observed</Reveal>);

    expect(screen.getByText("observed")).toBeTruthy();
  });

  it("renders as a div by default", () => {
    render(<Reveal data-testid="target">observed</Reveal>);

    expect(screen.getByTestId("target").tagName).toBe("DIV");
  });

  it("renders as the requested element so reveals never break document semantics", () => {
    render(
      <Reveal as="li" data-testid="target">
        observed
      </Reveal>,
    );

    expect(screen.getByTestId("target").tagName).toBe("LI");
  });

  it("forwards className so callers keep full layout control", () => {
    render(
      <Reveal className="mt-4" data-testid="target">
        observed
      </Reveal>,
    );

    expect(screen.getByTestId("target").className).toContain("mt-4");
  });
});

describe("RevealGroup", () => {
  it("renders every item", () => {
    render(
      <RevealGroup>
        <RevealItem>one</RevealItem>
        <RevealItem>two</RevealItem>
        <RevealItem>three</RevealItem>
      </RevealGroup>,
    );

    expect(screen.getByText("one")).toBeTruthy();
    expect(screen.getByText("two")).toBeTruthy();
    expect(screen.getByText("three")).toBeTruthy();
  });

  it("renders group and item as the requested elements so lists stay lists", () => {
    render(
      <RevealGroup as="ul" data-testid="group">
        <RevealItem as="li">one</RevealItem>
      </RevealGroup>,
    );

    const group = screen.getByTestId("group");
    expect(group.tagName).toBe("UL");
    expect(group.querySelector("li")).toBeTruthy();
  });
});
