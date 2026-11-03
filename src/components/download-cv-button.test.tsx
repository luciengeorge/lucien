import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DownloadCvButton } from "./download-cv-button";

function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

const clickedDownloads: Array<{ download: string; href: string }> = [];

beforeEach(() => {
  vi.useFakeTimers();
  URL.createObjectURL = vi.fn(() => "blob:resume");
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
    clickedDownloads.push({ download: this.download, href: this.href });
  });
});

afterEach(() => {
  cleanup();
  clickedDownloads.length = 0;
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("DownloadCvButton", () => {
  it("locks the button while the PDF downloads, then saves it and unlocks", async () => {
    const response = deferred<Response>();
    const fetchMock = vi.fn(() => response.promise);
    vi.stubGlobal("fetch", fetchMock);
    render(<DownloadCvButton />);
    const button = screen.getByRole("link", { name: /Download CV/ });

    fireEvent.click(button);
    fireEvent.click(button);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/resume/pdf");
    expect(button.getAttribute("aria-disabled")).toBe("true");

    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByRole("status", { name: "Loading" })).not.toBeNull();

    await act(async () => {
      response.resolve(new Response(new Blob(["%PDF"]), { status: 200 }));
      await vi.runAllTimersAsync();
    });

    expect(clickedDownloads).toEqual([{ download: "lucien-george-resume.pdf", href: "blob:resume" }]);
    expect(button.getAttribute("aria-disabled")).toBeNull();
    expect(screen.queryByRole("status", { name: "Loading" })).toBeNull();
  });

  it("shows an error and unlocks when the download fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 500 })),
    );
    const toastError = vi.spyOn(toast, "error");
    render(<DownloadCvButton />);
    const button = screen.getByRole("link", { name: /Download CV/ });

    await act(async () => {
      fireEvent.click(button);
      await vi.runAllTimersAsync();
    });

    expect(toastError).toHaveBeenCalledTimes(1);
    expect(clickedDownloads).toEqual([]);
    expect(button.getAttribute("aria-disabled")).toBeNull();
  });
});
