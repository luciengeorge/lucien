import type { BetterAuthOptions } from "better-auth";

import { APIError, createAuthMiddleware } from "better-auth/api";

import { createLogger } from "./logger";

const logger = createLogger("auth.email-verification");
const ALLOWED_AUTH_EMAIL = "lucienkgeorge@gmail.com";

function isAllowedAuthEmail(email: unknown) {
  return typeof email === "string" && email.trim().toLowerCase() === ALLOWED_AUTH_EMAIL;
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
