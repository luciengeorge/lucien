import type { BetterAuthOptions } from 'better-auth';

export const sharedAuthConfig = {
  appName: 'Lucien',
  baseURL: process.env.SITE_URL || 'http://localhost:3000',
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
  },
} satisfies Partial<BetterAuthOptions>;
