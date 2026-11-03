import type { MouseEvent } from "react";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { useSpinDelay } from "spin-delay";

/**
 * Downloads a file through fetch so the trigger can show a pending state: a
 * plain `<a download>` gives no signal while a slow response is on its way.
 * The trigger stays a real link, so it still works before hydration.
 */
export function useFileDownload(url: string, filename: string) {
  const [isDownloading, setIsDownloading] = useState(false);
  const inFlightRef = useRef(false);
  const showSpinner = useSpinDelay(isDownloading, { delay: 200, minDuration: 300 });

  const onClick = async (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setIsDownloading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Download failed with ${response.status}`);
      const objectUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      link.click();
      // Safari reads the blob after click() returns, so revoking straight away can cancel the save.
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch {
      toast.error("Couldn't download the PDF. Try again.");
    } finally {
      inFlightRef.current = false;
      setIsDownloading(false);
    }
  };

  return { isDownloading, onClick, showSpinner };
}
