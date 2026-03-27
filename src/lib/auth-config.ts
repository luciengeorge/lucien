import type { BetterAuthOptions } from "better-auth";

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
  emailVerification: {
    async sendVerificationEmail(data) {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: data.user.email,
        subject: "Verify your email",
        html: `<p>Click <a href="${data.url}">here</a> to verify your email</p>`,
      });
    },
  },
} satisfies Partial<BetterAuthOptions>;
