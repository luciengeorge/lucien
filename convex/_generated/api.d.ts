/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as conversations from "../conversations.js";
import type * as crons from "../crons.js";
import type * as digest from "../digest.js";
import type * as http from "../http.js";
import type * as intro from "../intro.js";
import type * as migrations from "../migrations.js";
import type * as rateLimits from "../rateLimits.js";
import type * as stripDashes from "../stripDashes.js";
import type * as voiceAgent from "../voiceAgent.js";
import type * as voiceCalls from "../voiceCalls.js";
import type * as voiceLimits from "../voiceLimits.js";
import type * as voiceWebhook from "../voiceWebhook.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  conversations: typeof conversations;
  crons: typeof crons;
  digest: typeof digest;
  http: typeof http;
  intro: typeof intro;
  migrations: typeof migrations;
  rateLimits: typeof rateLimits;
  stripDashes: typeof stripDashes;
  voiceAgent: typeof voiceAgent;
  voiceCalls: typeof voiceCalls;
  voiceLimits: typeof voiceLimits;
  voiceWebhook: typeof voiceWebhook;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("../betterAuth/_generated/component.js").ComponentApi<"betterAuth">;
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};
