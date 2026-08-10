import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { DownloadResumeLink } from "./download-resume-link";

afterEach(() => {
  cleanup();
});

describe("DownloadResumeLink", () => {
  it("points at the server-rendered PDF and downloads it", () => {
    render(<DownloadResumeLink />);

    const link = screen.getByRole("link", { name: /download pdf/i });
    expect(link.getAttribute("href")).toBe("/api/resume/pdf");
    expect(link.getAttribute("download")).toBe("lucien-george-resume.pdf");
  });

  it("says resume rather than anything grander", () => {
    render(<DownloadResumeLink />);

    expect(screen.queryByText(/curriculum vitae/i)).toBeNull();
  });

  it("stays off the printed page", () => {
    render(<DownloadResumeLink />);

    expect(screen.getByRole("link", { name: /download pdf/i }).className).toContain("print:hidden");
  });
});
