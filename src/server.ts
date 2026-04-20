import { createLogger } from "#/lib/logger";
import { wrapFetchWithSentry } from "@sentry/tanstackstart-react";
import handler, { createServerEntry } from "@tanstack/react-start/server-entry";

const logger = createLogger("server.request");

export default createServerEntry(
  wrapFetchWithSentry({
    async fetch(request: Request) {
      const startedAt = Date.now();
      const requestId = request.headers.get("x-vercel-id") ?? crypto.randomUUID();
      const url = new URL(request.url);

      logger.info("request received", {
        method: request.method,
        path: url.pathname,
        requestId,
      });

      try {
        const response = await handler.fetch(request);
        logger.info("request completed", {
          durationMs: Date.now() - startedAt,
          method: request.method,
          path: url.pathname,
          requestId,
          status: response.status,
        });
        return response;
      } catch (error) {
        logger.error("request failed", {
          durationMs: Date.now() - startedAt,
          error,
          method: request.method,
          path: url.pathname,
          requestId,
        });
        throw error;
      }
    },
  }),
);
