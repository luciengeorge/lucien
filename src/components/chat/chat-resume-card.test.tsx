import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ChatResumeCard } from "./chat-resume-card";

beforeEach(() => {
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("ChatResumeCard", () => {
  it("locks the download button until the PDF arrives", async () => {
    let respond: (response: Response) => void = () => {};
    const fetchMock = vi.fn(() => new Promise<Response>((resolve) => (respond = resolve)));
    vi.stubGlobal("fetch", fetchMock);
    render(<ChatResumeCard filename="resume.pdf" url="/api/resume/pdf" />);
    const button = screen.getByRole("button", { name: "Download resume.pdf" });

    fireEvent.click(button);
    fireEvent.click(button);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(button.getAttribute("aria-disabled")).toBe("true");

    await act(async () => {
      respond(new Response(new Blob(["%PDF"]), { status: 200 }));
    });

    expect(button.getAttribute("aria-disabled")).toBeNull();
  });
});
