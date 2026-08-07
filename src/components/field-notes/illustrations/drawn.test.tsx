import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { DrawnFigure, DrawnPath } from "./drawn";

afterEach(() => {
  cleanup();
});

describe("DrawnFigure", () => {
  it("exposes a label to assistive tech when the figure carries meaning", () => {
    render(
      <DrawnFigure label="Migration route from Beirut to London" viewBox="0 0 10 10">
        <DrawnPath d="M0 0 L10 10" />
      </DrawnFigure>,
    );

    expect(screen.getByRole("img", { name: "Migration route from Beirut to London" })).toBeTruthy();
  });

  it("hides itself from assistive tech when it is pure decoration", () => {
    const { container } = render(
      <DrawnFigure decorative viewBox="0 0 10 10">
        <DrawnPath d="M0 0 L10 10" />
      </DrawnFigure>,
    );

    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(screen.queryByRole("img")).toBeNull();
  });
});

describe("DrawnPath", () => {
  it("renders the path it was given", () => {
    const { container } = render(
      <DrawnFigure decorative viewBox="0 0 10 10">
        <DrawnPath d="M0 0 L10 10" />
      </DrawnFigure>,
    );

    expect(container.querySelector("path")?.getAttribute("d")).toBe("M0 0 L10 10");
  });

  it("never fills, so a closed outline reads as a drawn line and not a blob", () => {
    const { container } = render(
      <DrawnFigure decorative viewBox="0 0 10 10">
        <DrawnPath d="M0 0 L10 10 Z" />
      </DrawnFigure>,
    );

    expect(container.querySelector("path")?.getAttribute("fill")).toBe("none");
  });

  it("keeps a caller's dash pattern intact, since pathLength drawing would overwrite it", () => {
    const { container } = render(
      <DrawnFigure decorative viewBox="0 0 10 10">
        <DrawnPath d="M0 0 L10 10" strokeDasharray="5 4" />
      </DrawnFigure>,
    );

    expect(container.querySelector("path")?.getAttribute("stroke-dasharray")).toBe("5 4");
  });

  it("rounds caps and joins so the stroke reads as a pen rather than a vector", () => {
    const { container } = render(
      <DrawnFigure decorative viewBox="0 0 10 10">
        <DrawnPath d="M0 0 L10 10" />
      </DrawnFigure>,
    );

    const path = container.querySelector("path");
    expect(path?.getAttribute("stroke-linecap")).toBe("round");
    expect(path?.getAttribute("stroke-linejoin")).toBe("round");
  });
});
