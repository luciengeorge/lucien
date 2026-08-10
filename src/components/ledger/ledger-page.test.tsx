import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { LedgerPage, PageHeader, RailNote, Section } from "./ledger-page";

afterEach(() => {
  cleanup();
});

describe("PageHeader", () => {
  it("makes the title the h1 and keeps the section label out of the outline", () => {
    render(<PageHeader label="WORK" title="Where Lucien has worked" />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Where Lucien has worked");
    expect(screen.getByText("WORK").tagName).toBe("P");
  });

  it("renders anything else it is given beneath the title", () => {
    render(
      <PageHeader label="RESUME" title="Lucien George">
        <p>The short version.</p>
      </PageHeader>,
    );

    expect(screen.getByText("The short version.")).toBeTruthy();
  });
});

describe("Section", () => {
  it("titles itself with a real heading, so the page keeps a document outline", () => {
    render(
      <Section title="HOW HE SPENDS HIS TIME">
        <p>body</p>
      </Section>,
    );

    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("HOW HE SPENDS HIS TIME");
  });

  it("is a landmark-free section element carrying its children", () => {
    const { container } = render(
      <Section title="SHIPPED">
        <p>body</p>
      </Section>,
    );

    expect(container.querySelector("section")).toBeTruthy();
    expect(screen.getByText("body")).toBeTruthy();
  });
});

describe("LedgerPage", () => {
  it("puts the rail in a complementary landmark beside the main column", () => {
    render(
      <LedgerPage rail={<RailNote>Aside copy.</RailNote>}>
        <p>Main copy.</p>
      </LedgerPage>,
    );

    expect(screen.getByRole("complementary")).toBeTruthy();
    expect(screen.getByText("Aside copy.")).toBeTruthy();
    expect(screen.getByText("Main copy.")).toBeTruthy();
  });

  it("renders without a rail", () => {
    render(
      <LedgerPage>
        <p>Main copy.</p>
      </LedgerPage>,
    );

    expect(screen.queryByRole("complementary")).toBeNull();
    expect(screen.getByText("Main copy.")).toBeTruthy();
  });
});
