import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { ActorResult, JudgeVerdict } from "./types";

const __dirname = dirname(fileURLToPath(import.meta.url));

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
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.criteria === "object" &&
    v.criteria !== null &&
    typeof v.score === "number" &&
    typeof v.reasoning === "string"
  );
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

  try {
    const { text } = await generateText({
      model: openai(model),
      system: rubric,
      prompt: userPrompt,
      // Deterministic scoring — keeps the blocking gate stable across CI runs.
      temperature: 0,
    });

    const parsed = tryParseJson(text);
    if (!isJudgeVerdict(parsed)) {
      return { error: `judge returned unparseable verdict: ${text.slice(0, 200)}` };
    }

    // sanity: clamp score to [0,1] and recompute if it diverges drastically from criteria mean
    const criteriaValues = Object.values(parsed.criteria).filter((v): v is number => typeof v === "number");
    const computedMean =
      criteriaValues.length > 0 ? criteriaValues.reduce((a, b) => a + b, 0) / criteriaValues.length : 0;
    return {
      criteria: parsed.criteria,
      score: Math.max(0, Math.min(1, computedMean || parsed.score)),
      reasoning: parsed.reasoning,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}
