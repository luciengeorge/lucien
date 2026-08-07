import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { DownloadCvLink } from "./download-cv-link";

afterEach(() => {
  cleanup();
});

describe("DownloadCvLink", () => {
  it("points at the server-rendered PDF and downloads it", () => {
    render(<DownloadCvLink />);

    const link = screen.getByRole("link", { name: /download cv/i });
    expect(link.getAttribute("href")).toBe("/api/resume/pdf");
    expect(link.getAttribute("download")).toBe("lucien-george-resume.pdf");
  });
});
