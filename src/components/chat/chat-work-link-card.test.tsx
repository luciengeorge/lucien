import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const capture = vi.fn();

vi.mock("#/lib/analytics", () => ({
  AnalyticsEvent: { workLinkClicked: "work_link_clicked" },
  useAnalytics: () => ({ capture }),
}));

import { ChatWorkLinkCard } from "./chat-work-link-card";

afterEach(() => {
  cleanup();
  capture.mockClear();
});

describe("ChatWorkLinkCard", () => {
  it("captures work_link_clicked with the slug (and no raw message text) on click", () => {
    render(<ChatWorkLinkCard company="Fyxer" role="Senior Product Engineer" slug="fyxer" url="/work/fyxer" />);

    fireEvent.click(screen.getByRole("link", { name: /open/i }));

    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith("work_link_clicked", { slug: "fyxer" });
  });
});
