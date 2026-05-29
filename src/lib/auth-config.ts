import type { BetterAuthOptions } from "better-auth";

import { APIError, createAuthMiddleware } from "better-auth/api";

import { createLogger } from "./logger";

const logger = createLogger("auth.email-verification");
const PRIMARY_AUTH_EMAIL = "lucienkgeorge@gmail.com";

/**
 * Allowlist gate for sign-in/sign-up. The primary owner email is always allowed.
 * In non-production environments (e.g. CI for Playwright e2e tests), additional
 * emails can be permitted via the comma-separated `AUTH_ALLOWED_EMAILS` env var.
 */
function isAllowedAuthEmail(email: unknown): boolean {
  if (typeof email !== "string") return false;
  const normalized = email.trim().toLowerCase();
  if (normalized === PRIMARY_AUTH_EMAIL) return true;
  if (process.env.NODE_ENV === "production") return false;
  const extra = process.env.AUTH_ALLOWED_EMAILS;
  if (!extra) return false;
  return extra
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .includes(normalized);
}

export const sharedAuthConfig = {
  appName: "Lucien",
  get baseURL() {
    return process.env.SITE_URL || "http://localhost:3000";
  },
  get secret() {
    return process.env.BETTER_AUTH_SECRET;
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
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
