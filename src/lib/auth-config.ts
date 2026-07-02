import type { BetterAuthOptions } from "better-auth";

import { APIError, createAuthMiddleware } from "better-auth/api";

import { createLogger } from "./logger";

const logger = createLogger("auth.email-verification");
const PRIMARY_AUTH_EMAIL = "lucienkgeorge@gmail.com";

/**
 * Allowlist gate for sign-in/sign-up. The primary owner email is always allowed.
 * Additional emails can be permitted via the comma-separated `AUTH_ALLOWED_EMAILS`
 * env var, which is set ONLY on the dev Convex deployment (for Playwright e2e).
 *
 * NOTE: we deliberately do NOT gate on `NODE_ENV` - it is unreliable in the Convex
 * runtime (HTTP actions report "production" even on the dev deployment), which would
 * silently disable the allowlist. The security boundary is the env var itself:
 * production simply never has `AUTH_ALLOWED_EMAILS` set, so only the owner can sign in.
 */
function isAllowedAuthEmail(email: unknown): boolean {
  if (typeof email !== "string") return false;
  const normalized = email.trim().toLowerCase();
  if (normalized === PRIMARY_AUTH_EMAIL) return true;
  const extra = process.env.AUTH_ALLOWED_EMAILS;
  if (!extra) return false;
  return extra
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .includes(normalized);
}

/**
 * Email verification is required in normal operation. For Playwright e2e runs we seed
 * a throwaway user and need it to sign in immediately, so verification is disabled when
 * `E2E_TEST_MODE === "true"` - an env var set ONLY on the dev deployment, never prod.
 * (As above, `NODE_ENV` is not a reliable prod signal inside Convex.)
 */
function requireEmailVerification(): boolean {
  return process.env.E2E_TEST_MODE !== "true";
}

export const sharedAuthConfig = {
  appName: "Lucien",
  get baseURL() {
    return process.env.SITE_URL || "http://localhost:3000";
  },
  get secret() {
    return process.env.BETTER_AUTH_SECRET;
  },
  /**
   * Trusted origins for CSRF. Defaults to the configured site URL. In e2e test mode
   * (dev deployment only) we also trust the Playwright dev-server origins, which run
   * on a different port (3100) than SITE_URL.
   */
  get trustedOrigins() {
    const base = process.env.SITE_URL || "http://localhost:3000";
    if (process.env.E2E_TEST_MODE === "true") {
      return [base, "http://localhost:3100", "http://127.0.0.1:3100"];
    }
    return [base];
  },
  emailAndPassword: {
    enabled: true,
    get requireEmailVerification() {
      return requireEmailVerification();
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/email" && ctx.path !== "/sign-up/email") {
        return;
      }

      if (isAllowedAuthEmail(ctx.body?.email)) {
        return;
      }

      logger.warn("auth attempt rejected", {
        path: ctx.path,
      });

      throw new APIError("UNAUTHORIZED", {
        message: "Unauthorized",
      });
    }),
  },
  emailVerification: {
    async sendVerificationEmail(data) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: data.user.email,
          subject: "Verify your email",
          html: `<p>Click <a href="${data.url}">here</a> to verify your email</p>`,
        });

        logger.info("verification email sent", {
          emailDomain: data.user.email.split("@")[1],
          userId: data.user.id,
        });
      } catch (error) {
        logger.error("verification email failed", {
          emailDomain: data.user.email.split("@")[1],
          error,
          userId: data.user.id,
        });
        throw error;
      }
    },
  },
} satisfies Partial<BetterAuthOptions>;
