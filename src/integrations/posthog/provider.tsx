import type { ReactNode } from "react";

import { PostHogProvider as BasePostHogProvider } from "@posthog/react";
import posthog from "posthog-js";

const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
const posthogHost = import.meta.env.VITE_POSTHOG_HOST;
const isProduction = import.meta.env.PROD;

if (typeof window !== "undefined" && isProduction && posthogKey) {
  posthog.init(posthogKey, {
    api_host: posthogHost || "https://eu.i.posthog.com",
    defaults: "2026-01-30",
  });
}

interface PostHogProviderProps {
  children: ReactNode;
}

export default function PostHogProvider({ children }: PostHogProviderProps) {
  if (!isProduction || !posthogKey) {
    return <>{children}</>;
  }

  return <BasePostHogProvider client={posthog}>{children}</BasePostHogProvider>;
}
