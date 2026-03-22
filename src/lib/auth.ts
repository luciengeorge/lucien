import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";

import { sharedAuthConfig } from "./auth-config";

export const auth = betterAuth({
  ...sharedAuthConfig,
  plugins: [tanstackStartCookies()],
});
