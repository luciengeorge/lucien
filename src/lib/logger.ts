import * as Sentry from "@sentry/tanstackstart-react";

type LogLevel = "debug" | "info" | "warn" | "error";

type LogValue = string | number | boolean | null | undefined | LogValue[] | { [key: string]: LogValue };

type LogMeta = Record<string, unknown>;

const SENSITIVE_KEY_PATTERN = /pass|secret|token|cookie|authorization|apikey|api_key/i;
const MAX_ARRAY_PREVIEW = 10;
const MAX_DEPTH = 8;

function redactValue(value: unknown, key?: string, seen: WeakSet<object> = new WeakSet(), depth = 0): LogValue {
  if (key && SENSITIVE_KEY_PATTERN.test(key)) {
    return "[REDACTED]";
  }

  if (value instanceof Error) {
    return {
      message: value.message,
      name: value.name,
      stack: value.stack,
    };
  }

  if (value && typeof value === "object") {
    if (seen.has(value)) {
      return "[Circular]";
    }
    if (depth >= MAX_DEPTH) {
      return "[MaxDepth]";
    }
    seen.add(value);

    if (Array.isArray(value)) {
      return value.slice(0, MAX_ARRAY_PREVIEW).map((item) => redactValue(item, undefined, seen, depth + 1));
    }

    return Object.fromEntries(
      Object.entries(value).map(([nestedKey, nestedValue]) => [
        nestedKey,
        redactValue(nestedValue, nestedKey, seen, depth + 1),
      ]),
    );
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null ||
    value === undefined
  ) {
    return value;
  }

  return String(value);
}

function redactMeta(meta: LogMeta): Record<string, LogValue> {
  return Object.fromEntries(Object.entries(meta).map(([key, value]) => [key, redactValue(value, key)]));
}

/**
 * Forwards ERROR-level logs to Sentry. Prod-only (matching instrument.server.mjs's guard) and
 * fail-safe: any failure here must never break logging, so every path is wrapped in try/catch.
 */
function forwardErrorToSentry(message: string, meta?: LogMeta) {
  if (process.env.NODE_ENV !== "production") return;

  try {
    const rawError = meta && Object.values(meta).find((value): value is Error => value instanceof Error);
    const extra = meta ? redactMeta(meta) : undefined;

    if (rawError) {
      Sentry.captureException(rawError, { extra });
    } else {
      Sentry.captureMessage(message, { extra, level: "error" });
    }
  } catch {
    // Sentry must never break logging.
  }
}

function writeLog(level: LogLevel, scope: string, message: string, meta?: LogMeta) {
  if (level === "debug" && process.env.NODE_ENV === "production") {
    return;
  }

  const payload = {
    timestamp: new Date().toISOString(),
    level,
    scope,
    message,
    ...(meta ? redactMeta(meta) : {}),
  };

  let line: string;
  try {
    line = JSON.stringify(payload);
  } catch {
    line = JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      scope,
      message,
      meta: "[unserializable]",
    });
  }

  switch (level) {
    case "debug":
      console.debug(line);
      return;
    case "info":
      console.info(line);
      return;
    case "warn":
      console.warn(line);
      return;
    case "error":
      console.error(line);
      forwardErrorToSentry(message, meta);
      return;
  }
}

export function createLogger(scope: string) {
  return {
    debug: (message: string, meta?: LogMeta) => writeLog("debug", scope, message, meta),
    info: (message: string, meta?: LogMeta) => writeLog("info", scope, message, meta),
    warn: (message: string, meta?: LogMeta) => writeLog("warn", scope, message, meta),
    error: (message: string, meta?: LogMeta) => writeLog("error", scope, message, meta),
  };
}
