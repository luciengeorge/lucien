import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { LeaderRow, RailStat, RailStats } from "./leader-row";

afterEach(() => {
  cleanup();
});

describe("LeaderRow", () => {
  it("prints the label and its value", () => {
    render(<LeaderRow label="CURRENT" value="Fyxer" />);

    expect(screen.getByText("CURRENT")).toBeTruthy();
    expect(screen.getByText("Fyxer")).toBeTruthy();
  });

  it("runs a dotted leader across the gap between them", () => {
    const { container } = render(<LeaderRow label="CURRENT" value="Fyxer" />);

    expect(container.querySelector(".leader")).toBeTruthy();
  });

  it("holds the value on one line, so a column of rows stays aligned", () => {
    render(<LeaderRow label="SPAN" value="2013 · now" />);

    expect(screen.getByText("2013 · now").className).toContain("whitespace-nowrap");
  });

  it("places trailing content after the value", () => {
    render(<LeaderRow label="RESUME" trailing={<span>DOWNLOAD</span>} value="PDF" />);

    const label = screen.getByText("RESUME");
    const value = screen.getByText("PDF");
    const trailing = screen.getByText("DOWNLOAD");

    expect(label.compareDocumentPosition(value) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(value.compareDocumentPosition(trailing) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe("RailStats", () => {
  it("marks each row up as a term and its description", () => {
    const { container } = render(
      <RailStats label="ACCOUNT">
        <RailStat label="CURRENT" value="Fyxer" />
        <RailStat label="SPAN" value="2013 · now" />
      </RailStats>,
    );

    expect(container.querySelectorAll("dl").length).toBe(1);
    expect(container.querySelectorAll("dt").length).toBe(2);
    expect(container.querySelectorAll("dd").length).toBe(2);
    expect(screen.getByText("ACCOUNT")).toBeTruthy();
  });

  it("leads the eye from each term to its description", () => {
    const { container } = render(
      <RailStats label="ACCOUNT">
        <RailStat label="CURRENT" value="Fyxer" />
      </RailStats>,
    );

    expect(container.querySelector(".leader")).toBeTruthy();
  });
});
