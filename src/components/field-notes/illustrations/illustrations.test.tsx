import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { MountainSketch } from "./mountain-sketch";
import { Sparkline } from "./sparkline";

afterEach(() => {
  cleanup();
});

describe("Field Notes illustrations", () => {
  it("gives the mountain sketch an accessible name", () => {
    render(<MountainSketch />);

    expect(screen.getByRole("img", { name: /mountain profile/i })).toBeTruthy();
  });

  it("gives the sparkline an accessible name", () => {
    render(<Sparkline />);

    expect(screen.getByRole("img", { name: /circled peak/i })).toBeTruthy();
  });
});
