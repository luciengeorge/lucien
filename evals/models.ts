/*
 * Model defaults for the eval harness, in one place because each is also
 * declared in .github/workflows/evals.yml (a dispatch input default and a step
 * env fallback) with nothing to keep the three in step. models.test.ts asserts
 * they agree, so a change here fails until the workflow follows.
 *
 * Overridable per run via EVAL_ACTOR_MODEL / EVAL_JUDGE_MODEL /
 * EVAL_EXPANSION_MODEL.
 */

/** Plays Poof. Matches the model the production chat route uses. */
export const DEFAULT_ACTOR_MODEL = "gpt-5.6-luna";

/** Grades the actor against evals/rubric.md. Gates the PR. */
export const DEFAULT_JUDGE_MODEL = "gpt-5.6-luna";

/** Rewrites the question before retrieval, as the chat route does. */
export const DEFAULT_EXPANSION_MODEL = "gpt-5.6-luna";
