import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupTextarea } from "./input-group";

afterEach(() => {
  cleanup();
});

describe("InputGroupAddon", () => {
  it("focuses the group's textarea when the addon's empty space is clicked", () => {
    render(
      <InputGroup>
        <InputGroupTextarea aria-label="Message" />
        <InputGroupAddon align="block-end" data-testid="addon" />
      </InputGroup>,
    );

    fireEvent.click(screen.getByTestId("addon"));

    expect(document.activeElement).toBe(screen.getByLabelText("Message"));
  });

  it("still focuses an input", () => {
    render(
      <InputGroup>
        <InputGroupInput aria-label="Search" />
        <InputGroupAddon data-testid="addon" />
      </InputGroup>,
    );

    fireEvent.click(screen.getByTestId("addon"));

    expect(document.activeElement).toBe(screen.getByLabelText("Search"));
  });
});
