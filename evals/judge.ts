import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { ActorResult, JudgeVerdict } from "./types";

import { JudgeVerdictSchema } from "./types";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Judge stability controls. The judge is sampled N times with fixed seeds and
// the MEDIAN score is used. This keeps the blocking gate stable even when the
// configured model is a reasoning model that silently ignores `temperature`
// (on such models `seed`/`temperature` are best-effort, so the median is what
// actually tames run-to-run variance). Set EVAL_JUDGE_SAMPLES=1 to disable
// sampling when pointing at a deterministic, non-reasoning judge model.
const JUDGE_SAMPLES = Math.max(1, Math.trunc(Number(process.env.EVAL_JUDGE_SAMPLES ?? "3")) || 3);
const JUDGE_SEED = Math.trunc(Number(process.env.EVAL_JUDGE_SEED ?? "1234")) || 1234;

let cachedRubric: string | undefined;

async function loadRubric(): Promise<string> {
  if (cachedRubric) return cachedRubric;
  cachedRubric = await readFile(join(__dirname, "rubric.md"), "utf-8");
  return cachedRubric;
}

function tryParseJson(raw: string): unknown {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // some models wrap JSON in ```json fences — strip them
    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch?.[1]) {
      try {
        return JSON.parse(fenceMatch[1].trim());
      } catch {
        return null;
      }
    }
    return null;
  }
}

function isJudgeVerdict(value: unknown): value is JudgeVerdict {
  return JudgeVerdictSchema.safeParse(value).success;
}

async function scoreOnce(
  model: string,
  rubric: string,
  userPrompt: string,
  seed: number,
): Promise<JudgeVerdict | null> {
  const { text } = await generateText({
    model: openai(model),
    system: rubric,
    prompt: userPrompt,
    // Best-effort determinism; the median across samples is the real stabilizer.
    temperature: 0,
    seed,
  });

  const parsed = tryParseJson(text);
  if (!isJudgeVerdict(parsed)) return null;

  // sanity: clamp score to [0,1] and recompute if it diverges from criteria mean
  const criteriaValues = Object.values(parsed.criteria).filter((v): v is number => typeof v === "number");
  const computedMean =
    criteriaValues.length > 0 ? criteriaValues.reduce((a, b) => a + b, 0) / criteriaValues.length : 0;
  return {
    criteria: parsed.criteria,
    score: Math.max(0, Math.min(1, computedMean || parsed.score)),
    reasoning: parsed.reasoning,
  };
}

export async function judge({
  actor,
  model,
}: {
  actor: ActorResult;
  model: string;
}): Promise<JudgeVerdict | { error: string }> {
  const rubric = await loadRubric();
  const caseInfo = {
    id: actor.case.id,
    category: actor.case.category,
    subcategory: actor.case.subcategory,
    question: actor.case.question,
    expected_facts: actor.case.expected_facts ?? [],
    forbidden_patterns: actor.case.forbidden_patterns ?? [],
    required_behavior: actor.case.required_behavior ?? null,
  };

  const userPrompt = [
    "Evaluate the assistant's answer per the rubric for category `" + caseInfo.category + "`.",
    "",
    "CASE METADATA (do not include in output):",
    "```json",
    JSON.stringify(caseInfo, null, 2),
    "```",
    "",
    "RETRIEVED CONTEXT — the exact source material the assistant was given (RAG).",
    "Judge groundedness/fabrication AGAINST THIS CONTEXT, not against the short",
    "expected_facts list. Any claim supported by this context is grounded and must",
    "NOT be treated as fabrication, even if it goes beyond expected_facts.",
    "<<<CONTEXT",
    actor.retrievedContext || "(no context retrieved)",
    "CONTEXT>>>",
    "",
    "ASSISTANT ANSWER:",
    "<<<ANSWER",
    actor.answer,
    "ANSWER>>>",
    "",
    "Return ONLY the JSON verdict object (no markdown, no commentary).",
  ].join("\n");

  const verdicts: JudgeVerdict[] = [];
  let lastError = "judge produced no verdict";
  for (let sample = 0; sample < JUDGE_SAMPLES; sample++) {
    try {
      const verdict = await scoreOnce(model, rubric, userPrompt, JUDGE_SEED + sample);
      if (verdict) verdicts.push(verdict);
      else lastError = "judge returned unparseable verdict";
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  if (verdicts.length === 0) return { error: lastError };

  // Median score across samples — robust to a single outlier judgment.
  const sorted = [...verdicts].sort((a, b) => a.score - b.score);
  const median = sorted[Math.floor((sorted.length - 1) / 2)];
  return median ?? { error: lastError };
}
