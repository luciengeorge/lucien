import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ChatLedgerCard, ChatLedgerRow } from "./chat-ledger-card";

afterEach(() => {
  cleanup();
});

describe("ChatLedgerCard", () => {
  it("files its rows under a label", () => {
    render(
      <ChatLedgerCard label="REFERENCED">
        <ChatLedgerRow meta="2025 —" title="FYXER" />
      </ChatLedgerCard>,
    );

    expect(screen.getByText("REFERENCED")).toBeTruthy();
    expect(screen.getByText("FYXER")).toBeTruthy();
    expect(screen.getByText("2025 —")).toBeTruthy();
  });

  it("sits directly on the page rather than in a box", () => {
    const { container } = render(
      <ChatLedgerCard label="ATTACHED">
        <ChatLedgerRow title="RESUME" />
      </ChatLedgerCard>,
    );

    const card = container.querySelector("[data-slot='ledger-card']");
    expect(card?.className).not.toContain("rounded");
    expect(card?.className).not.toContain("shadow");
  });

  it("runs a leader from the title across to its meta", () => {
    const { container } = render(
      <ChatLedgerCard label="REFERENCED">
        <ChatLedgerRow meta="PDF · 1 PAGE" title="RESUME" />
      </ChatLedgerCard>,
    );

    expect(container.querySelector(".leader")).toBeTruthy();
  });

  it("drops the leader when there is no meta for it to reach", () => {
    const { container } = render(
      <ChatLedgerCard label="SENT">
        <ChatLedgerRow title="MESSAGE SENT TO LUCIEN" />
      </ChatLedgerCard>,
    );

    expect(container.querySelector(".leader")).toBeNull();
  });

  it("carries a description under the row when given one", () => {
    render(
      <ChatLedgerCard label="REFERENCED">
        <ChatLedgerRow description="Senior Product Engineer" title="FYXER" />
      </ChatLedgerCard>,
    );

    expect(screen.getByText("Senior Product Engineer")).toBeTruthy();
  });

  it("keeps the row marker decorative", () => {
    const { container } = render(
      <ChatLedgerCard label="REFERENCED">
        <ChatLedgerRow title="FYXER" />
      </ChatLedgerCard>,
    );

    expect(container.querySelector("[data-slot='row-marker']")?.getAttribute("aria-hidden")).toBe("true");
  });
});
