import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ChatIdentity } from "./chat-identity";

afterEach(() => {
  cleanup();
});

describe("ChatIdentity", () => {
  it("opens the page with a visible name, a one-line role and the short version one click away", () => {
    const { container } = render(<ChatIdentity compact={false} isStartingNew={false} onNew={vi.fn()} />);

    expect(screen.getByRole("heading", { level: 1, name: "Lucien George" })).not.toBeNull();
    expect(
      screen.getByText(
        (_, element) => element?.tagName === "P" && element.textContent === "Senior Product Engineer at Fyxer, London",
      ),
    ).not.toBeNull();
    const details = container.querySelector("details");
    expect(details?.open).toBe(false);
    expect(details?.querySelector("summary")?.textContent).toMatch(/Short version/);
  });

  it("keeps the short version's full text in the page for crawlers, even while it is closed", () => {
    const { container } = render(<ChatIdentity compact={false} isStartingNew={false} onNew={vi.fn()} />);

    // The agent-readiness check counts this: H1 + 7 H2s of static text without JavaScript.
    expect(container.querySelectorAll("details h2").length).toBeGreaterThanOrEqual(6);
  });

  it("shrinks to the name once a conversation is under way, so the transcript gets the screen", () => {
    const { container } = render(<ChatIdentity compact isStartingNew={false} onNew={vi.fn()} />);

    expect(screen.getByRole("heading", { level: 1, name: "Lucien George" })).not.toBeNull();
    expect(
      screen.queryByText(
        (_, element) => element?.tagName === "P" && element.textContent === "Senior Product Engineer at Fyxer, London",
      ),
    ).toBeNull();
    expect(container.querySelector("details")).toBeNull();
  });

  it("starts a new conversation from the identity row", () => {
    const onNew = vi.fn();
    render(<ChatIdentity compact isStartingNew={false} onNew={onNew} />);

    fireEvent.click(screen.getByRole("button", { name: "New" }));
    expect(onNew).toHaveBeenCalledTimes(1);
  });
});
