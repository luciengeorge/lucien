/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { ApiFromModules, FilterApi, FunctionReference } from "convex/server";

import type * as conversations from "../conversations.js";
import type * as http from "../http.js";
import type * as intro from "../intro.js";
import type * as rag from "../rag.js";
import type * as search from "../search.js";
import type * as seed from "../seed.js";

declare const fullApi: ApiFromModules<{
  conversations: typeof conversations;
  http: typeof http;
  intro: typeof intro;
  rag: typeof rag;
  search: typeof search;
  seed: typeof seed;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<typeof fullApi, FunctionReference<any, "public">>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<typeof fullApi, FunctionReference<any, "internal">>;

export declare const components: {
  actionCache: import("@convex-dev/action-cache/_generated/component.js").ComponentApi<"actionCache">;
  betterAuth: import("../betterAuth/_generated/component.js").ComponentApi<"betterAuth">;
  rag: import("@convex-dev/rag/_generated/component.js").ComponentApi<"rag">;
};
