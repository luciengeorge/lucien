import type { BetterAuthOptions } from 'better-auth';
import { resend } from './clients/resend';

export const sharedAuthConfig = {
  appName: 'Lucien',
  baseURL: process.env.SITE_URL || 'http://localhost:3000',
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    async sendVerificationEmail({ user, url }) {
      await resend.emails.send({
        from: 'Lucien <noreply@luciengeorge.com>',
        to: user.email,
        subject: 'Verify your email',
        html: `<p>Click <a href="${url}">here</a> to verify your email.</p>`,
      });
    },
  },
} satisfies Partial<BetterAuthOptions>;
