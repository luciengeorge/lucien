import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { DEFAULT_ACTOR_MODEL, DEFAULT_EXPANSION_MODEL, DEFAULT_JUDGE_MODEL } from "./models";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function loadWorkflow(): Promise<string> {
  return await readFile(join(__dirname, "..", ".github", "workflows", "evals.yml"), "utf-8");
}

/**
 * The `workflow_dispatch` input default, e.g. the `default: "..."` under
 * `judge_model:`. Returns null rather than undefined so a restructured
 * workflow fails the assertion instead of passing vacuously.
 */
function dispatchInputDefault(workflow: string, input: string): string | null {
  const match = new RegExp(`${input}:\\s*\\n(?:\\s+\\w+:.*\\n)*?\\s+default:\\s*"([^"]+)"`).exec(workflow);
  return match?.[1] ?? null;
}

/** The `||` fallback in the step env, e.g. `EVAL_JUDGE_MODEL: ${{ ... || 'x' }}`. */
function stepEnvFallback(workflow: string, envVar: string): string | null {
  const match = new RegExp(`${envVar}:\\s*\\$\\{\\{[^}]*\\|\\|\\s*'([^']+)'`).exec(workflow);
  return match?.[1] ?? null;
}

describe("eval model defaults", () => {
  it("judges with gpt-5.6-luna", () => {
    expect(DEFAULT_JUDGE_MODEL).toBe("gpt-5.6-luna");
  });

  /*
   * Each model is declared three times: once here, and twice in the workflow
   * (the dispatch input default and the step's env fallback). Nothing makes
   * them agree at runtime, and a mismatch is silent - CI would grade against a
   * different model than a local `pnpm evals` run, and the blocking gate's
   * thresholds are calibrated against whichever one CI happens to use.
   */
  it("declares the same judge model in the workflow as in code", async () => {
    const workflow = await loadWorkflow();
    expect(dispatchInputDefault(workflow, "judge_model")).toBe(DEFAULT_JUDGE_MODEL);
    expect(stepEnvFallback(workflow, "EVAL_JUDGE_MODEL")).toBe(DEFAULT_JUDGE_MODEL);
  });

  it("declares the same actor model in the workflow as in code", async () => {
    const workflow = await loadWorkflow();
    expect(dispatchInputDefault(workflow, "actor_model")).toBe(DEFAULT_ACTOR_MODEL);
    expect(stepEnvFallback(workflow, "EVAL_ACTOR_MODEL")).toBe(DEFAULT_ACTOR_MODEL);
  });

  /*
   * Query expansion has no workflow input: it is only ever the code default,
   * and it must track the actor because the actor's retrieval quality in an
   * eval run depends on the same expansion the production route performs.
   */
  it("expands queries with the actor model", () => {
    expect(DEFAULT_EXPANSION_MODEL).toBe(DEFAULT_ACTOR_MODEL);
  });
});
