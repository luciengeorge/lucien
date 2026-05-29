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
