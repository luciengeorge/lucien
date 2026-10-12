import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ChatMarkdown, isTrustedLink } from "./chat-markdown";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("isTrustedLink", () => {
  it.each([
    "/work/shopify",
    `${window.location.origin}/resume`,
    "https://github.com/luciengeorge",
    "https://www.linkedin.com/in/luciengeorge/",
    "https://www.instagram.com/luciengeorge",
    "https://x.com/luciengeorge16",
    "https://ico.org.uk/make-a-complaint/",
  ])("trusts %s", (url) => {
    expect(isTrustedLink(url)).toBe(true);
  });

  it.each(["https://evil.example/login", "https://github.com.evil.example", "javascript:alert(1)"])(
    "does not trust %s",
    (url) => {
      expect(isTrustedLink(url)).toBe(false);
    },
  );
});

describe("ChatMarkdown links", () => {
  /* Streamdown asks "open external link?" in a modal for every link by default. */
  it("opens a link to one of Lucien's profiles straight away, without the modal", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    render(<ChatMarkdown isAnimating={false} text="Find him on [GitHub](https://github.com/luciengeorge)." />);

    fireEvent.click(await screen.findByText("GitHub", undefined, { timeout: 5000 }));

    await waitFor(() => expect(open).toHaveBeenCalledWith("https://github.com/luciengeorge", "_blank", "noreferrer"));
    expect(screen.queryByText("Open external link?")).toBeNull();
  });

  it("still asks before opening a link to anywhere else", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    render(<ChatMarkdown isAnimating={false} text="[Click](https://evil.example/login)" />);

    fireEvent.click(await screen.findByText("Click", undefined, { timeout: 5000 }));

    expect(await screen.findByText("Open external link?")).not.toBeNull();
    expect(open).not.toHaveBeenCalled();
  });
});
