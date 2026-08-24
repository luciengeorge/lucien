import type { PostHog } from "posthog-js";

// Lazy posthog-js singleton. Keeps the ~247KB posthog bundle out of the main
// entry chunk: it is dynamically imported after hydration via loadPostHog().
let instance: PostHog | null = null;
let initPromise: Promise<PostHog | null> | null = null;

const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
const posthogHost = import.meta.env.VITE_POSTHOG_HOST;
const isProduction = import.meta.env.PROD;

export function getPostHog(): PostHog | null {
  return instance;
}

export function loadPostHog(): Promise<PostHog | null> {
  if (typeof window === "undefined" || !isProduction || !posthogKey) {
    return Promise.resolve(null);
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = import("posthog-js").then(({ default: posthog }) => {
    /*
     * Cookieless: PostHog stores nothing in cookies, localStorage or
     * sessionStorage, and counts visitors with a server-side privacy-preserving
     * hash instead. That is what lets the site run with no consent banner and
     * no non-essential cookies at all, which is worth more than the
     * cross-session identity we lose (autocapture was already off, so the only
     * events are the ones the code names).
     */
    posthog.init(posthogKey, {
      api_host: posthogHost || "https://eu.i.posthog.com",
      autocapture: false,
      capture_pageleave: true,
      capture_pageview: true,
      cookieless_mode: "always",
      defaults: "2026-01-30",
      person_profiles: "identified_only",
    });

    posthog.register({ app: "lucien", source: "web" });
    instance = posthog;
    return posthog;
  });

  return initPromise;
}
