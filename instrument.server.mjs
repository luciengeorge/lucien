import * as Sentry from "@sentry/tanstackstart-react";

if (process.env.NODE_ENV === "production" && process.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.VITE_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    sendDefaultPii: true,
    // Keep cold starts light: skip Sentry's default OpenTelemetry
    // auto-instrumentations and only register lightweight error-capture
    // integrations. We still capture exceptions (manual + uncaught/unhandled
    // + wrapFetchWithSentry) but don't pay the OTel setup cost on every cold
    // start.
    defaultIntegrations: false,
    integrations: [
      Sentry.onUncaughtExceptionIntegration(),
      Sentry.onUnhandledRejectionIntegration(),
      Sentry.contextLinesIntegration(),
      Sentry.nodeContextIntegration(),
    ],
    registerEsmLoaderHooks: false,
    tracesSampleRate: 0,
  });
}
