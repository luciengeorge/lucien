import type { GenericCtx } from "@convex-dev/better-auth/utils";
import type { BetterAuthOptions } from "better-auth";

import { createClient } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth";

import type { DataModel } from "../_generated/dataModel";

import { sharedAuthConfig } from "../../src/lib/auth-config";
import { components } from "../_generated/api";
import authConfig from "../auth.config";
import schema from "../schema";

// Better Auth Component
export const authComponent = createClient<DataModel, typeof schema>(components.betterAuth, {
  local: { schema },
  verbose: false,
});

// Better Auth Options
export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
  return {
    ...sharedAuthConfig,
    database: authComponent.adapter(ctx),
    plugins: [convex({ authConfig })],
  } satisfies BetterAuthOptions;
};

// For `auth` CLI: the better-auth CLI only introspects static options (database
// adapter + plugins) to generate the schema - it never executes a request, so
// there is no real Convex ctx to pass here. This empty placeholder is the
// framework-prescribed boundary assertion and the one unavoidable cast.
// oxlint-disable-next-line typescript/consistent-type-assertions
export const options = createAuthOptions({} as GenericCtx<DataModel>);

// Better Auth Instance
export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth(createAuthOptions(ctx));
};
