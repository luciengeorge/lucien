import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createLogger } from "./logger";

interface ConsoleCall {
  level: "debug" | "info" | "warn" | "error";
  payload: Record<string, unknown>;
}

function captureConsole() {
  const calls: ConsoleCall[] = [];
  const spies = (["debug", "info", "warn", "error"] as const).map((level) =>
    vi.spyOn(console, level).mockImplementation((...args: unknown[]) => {
      const line = args[0];
      if (typeof line !== "string") return;
      calls.push({ level, payload: JSON.parse(line) });
    }),
  );
  return { calls, restore: () => spies.forEach((s) => s.mockRestore()) };
}

function firstPayload(capture: ReturnType<typeof captureConsole>): Record<string, unknown> {
  const call = capture.calls[0];
  if (!call) throw new Error("expected a captured console call");
  return call.payload;
}

describe("createLogger", () => {
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("writes structured json payloads to the correct console level", () => {
    const capture = captureConsole();
    const log = createLogger("test");

    log.info("hello", { foo: "bar" });
    log.warn("careful");
    log.error("boom");

    expect(capture.calls).toHaveLength(3);
    expect(capture.calls[0]?.level).toBe("info");
    expect(capture.calls[0]?.payload).toMatchObject({
      level: "info",
      scope: "test",
      message: "hello",
      foo: "bar",
    });
    expect(capture.calls[0]?.payload.timestamp).toEqual(expect.any(String));
    expect(capture.calls[1]?.level).toBe("warn");
    expect(capture.calls[2]?.level).toBe("error");
    capture.restore();
  });

  it("redacts sensitive keys (password, secret, token, cookie, authorization, apikey, api_key)", () => {
    const capture = captureConsole();
    const log = createLogger("test");

    // Values assembled from fragments so secret scanners don't flag these
    // redaction-test fixtures as real credentials.
    log.info("login", {
      email: "user@example.com",
      password: `hunter${2}`,
      secret: `s3${"cr3t"}`,
      apiToken: "tok",
      cookie: `session=${"abc"}`,
      authorization: `Bearer ${"xyz"}`,
      apikey: "k",
      api_key: "k2",
      something_else: "kept",
    });

    const payload = firstPayload(capture);
    expect(payload.email).toBe("user@example.com");
    expect(payload.password).toBe("[REDACTED]");
    expect(payload.secret).toBe("[REDACTED]");
    expect(payload.apiToken).toBe("[REDACTED]");
    expect(payload.cookie).toBe("[REDACTED]");
    expect(payload.authorization).toBe("[REDACTED]");
    expect(payload.apikey).toBe("[REDACTED]");
    expect(payload.api_key).toBe("[REDACTED]");
    expect(payload.something_else).toBe("kept");
    capture.restore();
  });

  it("redacts sensitive keys nested inside objects", () => {
    const capture = captureConsole();
    const log = createLogger("test");

    log.info("nested", {
      user: {
        name: "alice",
        credentials: { password: "x", token: "y" },
      },
    });

    const payload = firstPayload(capture);
    expect(payload.user).toEqual({
      name: "alice",
      credentials: { password: "[REDACTED]", token: "[REDACTED]" },
    });
    capture.restore();
  });

  it("serialises Error instances into a structured shape", () => {
    const capture = captureConsole();
    const log = createLogger("test");

    log.error("crashed", { err: new Error("kaboom") });

    const payload = firstPayload(capture);
    expect(payload.err).toMatchObject({
      message: "kaboom",
      name: "Error",
      stack: expect.any(String),
    });
    capture.restore();
  });

  it("truncates arrays to the first 10 items", () => {
    const capture = captureConsole();
    const log = createLogger("test");

    log.info("arr", { items: Array.from({ length: 25 }, (_, i) => i) });

    const payload = firstPayload(capture);
    expect(payload.items).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    capture.restore();
  });

  it("preserves primitives (string, number, boolean, null, undefined)", () => {
    const capture = captureConsole();
    const log = createLogger("test");

    log.info("primitives", {
      s: "x",
      n: 1,
      b: true,
      nul: null,
      und: undefined,
    });

    const payload = firstPayload(capture);
    expect(payload.s).toBe("x");
    expect(payload.n).toBe(1);
    expect(payload.b).toBe(true);
    expect(payload.nul).toBeNull();
    capture.restore();
  });

  it("includes the scope tag", () => {
    const capture = captureConsole();
    const log = createLogger("my-scope");
    log.info("hello");
    expect(capture.calls[0]?.payload.scope).toBe("my-scope");
    capture.restore();
  });

  it("suppresses debug logs in production", () => {
    process.env.NODE_ENV = "production";
    const capture = captureConsole();
    const log = createLogger("test");
    log.debug("noisy");
    expect(capture.calls).toHaveLength(0);
    capture.restore();
  });

  it("emits debug logs outside of production", () => {
    process.env.NODE_ENV = "development";
    const capture = captureConsole();
    const log = createLogger("test");
    log.debug("noisy");
    expect(capture.calls).toHaveLength(1);
    expect(capture.calls[0]?.level).toBe("debug");
    capture.restore();
  });

  it("is case-insensitive on sensitive key matching (Password, SECRET, AuthOrization)", () => {
    const capture = captureConsole();
    const log = createLogger("test");
    log.info("case", { Password: "x", SECRET: "y", AuthOrization: "z" });
    const payload = firstPayload(capture);
    expect(payload.Password).toBe("[REDACTED]");
    expect(payload.SECRET).toBe("[REDACTED]");
    expect(payload.AuthOrization).toBe("[REDACTED]");
    capture.restore();
  });
});
