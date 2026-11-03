import type { MouseEvent } from "react";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { useSpinDelay } from "spin-delay";

/**
 * Gives a download link a pending state: a plain `<a download>` shows nothing
 * while a slow response is on its way. The click fetches the file first (which
 * fills the HTTP cache), then a native link click saves it. A blob URL would
 * skip the second request, but iOS in-app browsers (LinkedIn, Gmail) silently
 * ignore blob downloads; a real link still opens the PDF there.
 * The trigger stays a real link, so it works before hydration and with
 * modifier clicks.
 */
export function useFileDownload(url: string, filename: string) {
  const [isDownloading, setIsDownloading] = useState(false);
  const inFlightRef = useRef(false);
  const showSpinner = useSpinDelay(isDownloading, { delay: 200, minDuration: 300 });

  const onClick = async (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setIsDownloading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Download failed with ${response.status}`);
      await response.blob();
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
    } catch {
      toast.error("Couldn't download the PDF. Try again.");
    } finally {
      inFlightRef.current = false;
      setIsDownloading(false);
    }
  };

  return { isDownloading, onClick, showSpinner };
}
