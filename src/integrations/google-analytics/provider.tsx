import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

const GA_MEASUREMENT_ID = "G-8YLBT9M560";
const isProduction = import.meta.env.PROD;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

const inlineInitScript = `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());`;

export function GoogleAnalyticsScripts() {
  if (!isProduction) return null;

  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
      <script dangerouslySetInnerHTML={{ __html: inlineInitScript }} />
    </>
  );
}

export function GoogleAnalyticsPageViews() {
  const router = useRouter();

  useEffect(() => {
    if (!isProduction) return;

    const sendPageView = () => {
      if (typeof window === "undefined" || typeof window.gtag !== "function") return;
      window.gtag("config", GA_MEASUREMENT_ID, {
        page_location: window.location.href,
        page_path: window.location.pathname,
        page_title: document.title,
      });
    };

    sendPageView();
    return router.subscribe("onResolved", sendPageView);
  }, [router]);

  return null;
}
