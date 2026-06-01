import { createRouter as createTanStackRouter } from "@tanstack/react-router";

import { getContext } from "./integrations/tanstack-query/root-provider";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,

    context: getContext(),

    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
  });

  if (!router.isServer && import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    // Lazy-loaded so the Sentry browser SDK is a separate chunk instead of
    // weighing down the main entry bundle.
    void import("@sentry/tanstackstart-react").then((Sentry) => {
      Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        environment: import.meta.env.MODE,
        sendDefaultPii: true,
      });
    });
  }

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
