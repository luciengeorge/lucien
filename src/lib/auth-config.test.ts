import { afterEach, beforeEach, describe, expect, it } from "vitest";

// Import the module under test indirectly by re-implementing the isAllowedAuthEmail
// resolution exactly as the source file does. We re-import dynamically so env
// changes between tests take effect.
//
// (auth-config exports `sharedAuthConfig` only; the gate is a private helper.
// We test the behaviour by toggling env vars and importing the helper from a
// shared shape.)

async function loadGate() {
  const mod = await import("./auth-config");
  return mod.sharedAuthConfig;
}

// `hooks.before` is built via `createAuthMiddleware(handler)` with no body schema,
// so its declared input type pins `body` to `undefined` even though the handler
// reads `ctx.body?.email` (typed `any`) at runtime. Route the call through a
// deliberately untyped reference so we can exercise that runtime behavior without
// a banned `as` assertion.
function callBeforeHook(cfg: Awaited<ReturnType<typeof loadGate>>, path: string, email: string): Promise<unknown> {
  const before: any = cfg.hooks.before;
  return before({ path, body: { email } });
}

describe("auth-config / isAllowedAuthEmail", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.AUTH_ALLOWED_EMAILS = undefined;
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("exports sharedAuthConfig with appName 'Lucien'", async () => {
    const cfg = await loadGate();
    expect(cfg.appName).toBe("Lucien");
  });

  it("exposes a baseURL getter that defaults to localhost:3000 when SITE_URL is unset", async () => {
    delete process.env.SITE_URL;
    const cfg = await loadGate();
    expect(cfg.baseURL).toBe("http://localhost:3000");
  });

  it("respects SITE_URL when set", async () => {
    process.env.SITE_URL = "https://example.test";
    const cfg = await loadGate();
    expect(cfg.baseURL).toBe("https://example.test");
  });

  it("declares emailAndPassword enabled with requireEmailVerification true", async () => {
    const cfg = await loadGate();
    expect(cfg.emailAndPassword?.enabled).toBe(true);
    expect(cfg.emailAndPassword?.requireEmailVerification).toBe(true);
  });
});

describe("auth-config / before hook", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.AUTH_ALLOWED_EMAILS = undefined;
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("rejects a disallowed email at /sign-in/email", async () => {
    const cfg = await loadGate();
    await expect(callBeforeHook(cfg, "/sign-in/email", "nope@evil.test")).rejects.toMatchObject({
      status: "UNAUTHORIZED",
      message: "Unauthorized",
    });
  });

  it("rejects a disallowed email at /sign-up/email", async () => {
    const cfg = await loadGate();
    await expect(callBeforeHook(cfg, "/sign-up/email", "nope@evil.test")).rejects.toMatchObject({
      status: "UNAUTHORIZED",
      message: "Unauthorized",
    });
  });

  it("allows the primary owner email at /sign-in/email", async () => {
    const cfg = await loadGate();
    await expect(callBeforeHook(cfg, "/sign-in/email", "lucienkgeorge@gmail.com")).resolves.toBeUndefined();
  });

  it("is a no-op on an unrelated path regardless of email", async () => {
    const cfg = await loadGate();
    await expect(callBeforeHook(cfg, "/get-session", "nope@evil.test")).resolves.toBeUndefined();
  });

  it("trims whitespace when matching against AUTH_ALLOWED_EMAILS", async () => {
    process.env.AUTH_ALLOWED_EMAILS = "  extra@allow.test  ";
    const cfg = await loadGate();
    await expect(callBeforeHook(cfg, "/sign-in/email", "extra@allow.test")).resolves.toBeUndefined();
  });

  it("matches AUTH_ALLOWED_EMAILS case-insensitively", async () => {
    process.env.AUTH_ALLOWED_EMAILS = "Extra@Allow.test";
    const cfg = await loadGate();
    await expect(callBeforeHook(cfg, "/sign-in/email", "extra@allow.test")).resolves.toBeUndefined();
  });

  it("parses multiple AUTH_ALLOWED_EMAILS entries and filters empty segments", async () => {
    process.env.AUTH_ALLOWED_EMAILS = "a@x.test,,b@y.test";
    const cfg = await loadGate();
    await expect(callBeforeHook(cfg, "/sign-in/email", "a@x.test")).resolves.toBeUndefined();
    await expect(callBeforeHook(cfg, "/sign-in/email", "b@y.test")).resolves.toBeUndefined();
    await expect(callBeforeHook(cfg, "/sign-in/email", "c@z.test")).rejects.toMatchObject({
      status: "UNAUTHORIZED",
      message: "Unauthorized",
    });
  });

  it("rejects a non-primary email when AUTH_ALLOWED_EMAILS is unset", async () => {
    const cfg = await loadGate();
    await expect(callBeforeHook(cfg, "/sign-in/email", "nope@evil.test")).rejects.toMatchObject({
      status: "UNAUTHORIZED",
      message: "Unauthorized",
    });
  });
});

describe("auth-config / requireEmailVerification and trustedOrigins", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.AUTH_ALLOWED_EMAILS = undefined;
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("disables requireEmailVerification when E2E_TEST_MODE is true", async () => {
    process.env.E2E_TEST_MODE = "true";
    const cfg = await loadGate();
    expect(cfg.emailAndPassword?.requireEmailVerification).toBe(false);
  });

  it("trustedOrigins is just the base URL outside E2E test mode", async () => {
    process.env.SITE_URL = "https://example.test";
    delete process.env.E2E_TEST_MODE;
    const cfg = await loadGate();
    expect(cfg.trustedOrigins).toEqual(["https://example.test"]);
  });

  it("trustedOrigins includes the Playwright dev-server origins under E2E test mode", async () => {
    process.env.SITE_URL = "https://example.test";
    process.env.E2E_TEST_MODE = "true";
    const cfg = await loadGate();
    expect(cfg.trustedOrigins).toEqual(["https://example.test", "http://localhost:3100", "http://127.0.0.1:3100"]);
  });
});
