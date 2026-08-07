import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { DrawnFigure, DrawnPath, DrawnRect } from "./drawn";

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

/*
 * These live at the primitive rather than on whichever illustration currently
 * happens to draw a dashed rect. The dash/pathLength collision was a real bug,
 * and its only coverage used to be an incidental assertion in a figure that a
 * later redesign removed. Contract-level tests survive redesigns.
 */
describe("DrawnRect", () => {
  it("keeps an authored dash pattern intact", () => {
    const { container } = render(
      <DrawnFigure decorative viewBox="0 0 100 100">
        <DrawnRect height={40} strokeDasharray="6 4" width={60} x={10} y={10} />
      </DrawnFigure>,
    );

    expect(container.querySelector("rect")?.getAttribute("stroke-dasharray")).toBe("6 4");
  });

  it("never fills, so a box reads as a drawn outline", () => {
    const { container } = render(
      <DrawnFigure decorative viewBox="0 0 100 100">
        <DrawnRect height={40} width={60} x={10} y={10} />
      </DrawnFigure>,
    );

    expect(container.querySelector("rect")?.getAttribute("fill")).toBe("none");
  });

  it("renders at the position and size it was given", () => {
    const { container } = render(
      <DrawnFigure decorative viewBox="0 0 100 100">
        <DrawnRect height={40} width={60} x={10} y={12} />
      </DrawnFigure>,
    );

    const rect = container.querySelector("rect");
    expect(rect?.getAttribute("x")).toBe("10");
    expect(rect?.getAttribute("y")).toBe("12");
    expect(rect?.getAttribute("width")).toBe("60");
    expect(rect?.getAttribute("height")).toBe("40");
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
