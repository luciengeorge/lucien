import { openai } from "@ai-sdk/openai";
import { generateText, stepCountIs } from "ai";
import { ConvexHttpClient } from "convex/browser";
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

import type { ActorResult, CategorySummary, EvalCase, EvalCategory, EvalReport, EvalResult } from "./types";

import { api } from "../convex/_generated/api";
import { buildChatTools } from "../src/lib/chat/tools";
import { judge } from "./judge";
import { DEFAULT_ACTOR_MODEL, DEFAULT_EXPANSION_MODEL, DEFAULT_JUDGE_MODEL } from "./models";
import { EvalCaseSchema } from "./types";

const __dirname = dirname(fileURLToPath(import.meta.url));

const ACTOR_MODEL = process.env.EVAL_ACTOR_MODEL ?? DEFAULT_ACTOR_MODEL;
const JUDGE_MODEL = process.env.EVAL_JUDGE_MODEL ?? DEFAULT_JUDGE_MODEL;
const EXPANSION_MODEL = process.env.EVAL_EXPANSION_MODEL ?? DEFAULT_EXPANSION_MODEL;
// Fixed seed + temperature 0 for reproducible actor/expansion output. These are
// best-effort on reasoning models (which ignore temperature) but make the run
// fully deterministic on non-reasoning models. Override via EVAL_SEED.
const EVAL_SEED = Math.trunc(Number(process.env.EVAL_SEED ?? "1234")) || 1234;

// Inlined from src/routes/api/chat/index.ts - same prompt used in production.
const QUERY_EXPANSION_PROMPT = `Rewrite the user's question into a better search query for finding relevant information about Lucien George's portfolio, career, projects, and personal life. Add context and relevant keywords. Return ONLY the rewritten query, nothing else.

Examples:
- "what do you do?" → "Lucien George current role job position software engineer work"
- "where does he work now?" → "Lucien George current company current role Fyxer Senior Product Engineer notetaker product"
- "what's his github?" → "Lucien George GitHub LinkedIn Twitter X Instagram social links profiles"
- "tell me about yourself" → "Lucien George bio background personal story origin education career"
- "what's your stack?" → "Lucien George tech stack programming languages frameworks tools TypeScript React"
- "any side projects?" → "Lucien George side projects startups co-founder Localista Skyla open source"
- "where did you study?" → "Lucien George education university McGill Le Wagon Harvard degree"`;

async function loadCases(file: string): Promise<EvalCase[]> {
  const text = await readFile(join(__dirname, "datasets", file), "utf-8");
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return EvalCaseSchema.parse(JSON.parse(line));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Bad JSONL line ${index + 1} in ${file}: ${message}`);
      }
    });
}

async function loadThresholds(): Promise<Record<EvalCategory, { min_pass_rate: number; min_average_score: number }>> {
  const raw = await readFile(join(__dirname, "thresholds.json"), "utf-8");
  return JSON.parse(raw);
}

async function loadSystemPrompt(): Promise<string> {
  return await readFile(join(__dirname, "..", "content", "system-prompt.md"), "utf-8");
}

async function expandQuery(query: string): Promise<string> {
  try {
    const { text } = await generateText({
      model: openai(EXPANSION_MODEL),
      system: QUERY_EXPANSION_PROMPT,
      prompt: query,
      temperature: 0,
      seed: EVAL_SEED,
    });
    return text.trim();
  } catch {
    return query;
  }
}

async function actorRun({
  systemPromptTemplate,
  convex,
  evalCase,
}: {
  systemPromptTemplate: string;
  convex: ConvexHttpClient;
  evalCase: EvalCase;
}): Promise<ActorResult> {
  const start = performance.now();
  const expandedQuery = await expandQuery(evalCase.question);

  let context = "";
  try {
    context = await convex.action(api.search.searchContext, { query: expandedQuery });
  } catch (error) {
    context = `[rag failed: ${error instanceof Error ? error.message : String(error)}]`;
  }

  const system = systemPromptTemplate.replace("{retrieved_context}", context);
  const { text } = await generateText({
    model: openai(ACTOR_MODEL),
    system,
    prompt: evalCase.question,
    temperature: 0,
    seed: EVAL_SEED,
    stopWhen: stepCountIs(3),
    tools: buildChatTools({
      conversationId: `eval-${evalCase.id}`,
      // Never actually messages Lucien: the harness would send 57 of these per run.
      postContact: () => Promise.resolve(true),
    }),
  });

  return {
    case: evalCase,
    answer: text,
    retrievedContext: context,
    contextLength: context.length,
    expandedQuery,
    durationMs: performance.now() - start,
  };
}

function summariseByCategory(
  results: EvalResult[],
  thresholds: Record<EvalCategory, { min_pass_rate: number; min_average_score: number }>,
): CategorySummary[] {
  const categories: EvalCategory[] = ["factual", "adversarial", "edge-case"];
  return categories.map<CategorySummary>((category) => {
    const rows = results.filter((r) => r.case.category === category);
    const total = rows.length;
    const passed = rows.filter((r) => r.passed).length;
    const scores = rows.map((r) => ("score" in r.judge ? r.judge.score : 0));
    const averageScore = total > 0 ? scores.reduce((a, b) => a + b, 0) / total : 0;
    const passRate = total > 0 ? passed / total : 0;
    const cfg = thresholds[category];
    return {
      category,
      total,
      passed,
      averageScore,
      passRate,
      thresholds: cfg,
      meetsThresholds: passRate >= cfg.min_pass_rate && averageScore >= cfg.min_average_score,
    };
  });
}

function buildMarkdownSummary(report: EvalReport): string {
  const lines: string[] = [
    "# Poof eval report",
    "",
    `**Started**: ${report.startedAt}  `,
    `**Completed**: ${report.completedAt}  `,
    `**Actor model**: \`${report.actorModel}\`  `,
    `**Judge model**: \`${report.judgeModel}\``,
    "",
    `**Overall**: ${report.overallPassed ? "✅ PASS" : "❌ FAIL"}`,
    "",
    "## Summary by category",
    "",
    "| Category | Passed | Total | Pass rate | Avg score | Meets thresholds |",
    "|---|---|---|---|---|---|",
  ];
  for (const cat of report.categories) {
    lines.push(
      `| ${cat.category} | ${cat.passed} | ${cat.total} | ${(cat.passRate * 100).toFixed(1)}% (need ≥${(cat.thresholds.min_pass_rate * 100).toFixed(0)}%) | ${cat.averageScore.toFixed(2)} (need ≥${cat.thresholds.min_average_score.toFixed(2)}) | ${cat.meetsThresholds ? "✅" : "❌"} |`,
    );
  }
  lines.push("");
  lines.push("## Failed cases");
  lines.push("");
  const failures = report.results.filter((r) => !r.passed);
  if (failures.length === 0) {
    lines.push("_None._");
  } else {
    for (const f of failures) {
      const reasoning = "reasoning" in f.judge ? f.judge.reasoning : f.judge.error;
      const score = "score" in f.judge ? f.judge.score.toFixed(2) : "-";
      lines.push(`### ${f.case.id} (${f.case.category}/${f.case.subcategory}) - score ${score}`);
      lines.push("");
      lines.push(`**Q**: ${f.case.question}`);
      lines.push("");
      lines.push(`**A**: ${f.actor.answer.replace(/\n+/g, " ").slice(0, 400)}`);
      lines.push("");
      lines.push(`**Judge**: ${reasoning}`);
      lines.push("");
    }
  }
  return lines.join("\n");
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is required");
    process.exit(1);
  }
  const convexUrl = process.env.VITE_CONVEX_URL;
  if (!convexUrl) {
    console.error("VITE_CONVEX_URL is required");
    process.exit(1);
  }

  const startedAt = new Date().toISOString();
  console.log(`[evals] starting at ${startedAt}, actor=${ACTOR_MODEL}, judge=${JUDGE_MODEL}`);

  const [factual, adversarial, edge, thresholds, systemPromptTemplate] = await Promise.all([
    loadCases("factual.jsonl"),
    loadCases("adversarial.jsonl"),
    loadCases("edge-cases.jsonl"),
    loadThresholds(),
    loadSystemPrompt(),
  ]);

  const allCases = [...factual, ...adversarial, ...edge];
  console.log(
    `[evals] loaded ${allCases.length} cases (factual=${factual.length}, adversarial=${adversarial.length}, edge=${edge.length})`,
  );

  const convex = new ConvexHttpClient(convexUrl);

  const results: EvalResult[] = [];
  for (const evalCase of allCases) {
    process.stdout.write(`[evals] ${evalCase.id} … `);
    const actor = await actorRun({ systemPromptTemplate, convex, evalCase });
    const verdict = await judge({ actor, model: JUDGE_MODEL });
    const passed = "score" in verdict ? verdict.score >= 0.85 : false;
    results.push({ case: evalCase, actor, judge: verdict, passed });
    console.log(`${passed ? "PASS" : "FAIL"} (${"score" in verdict ? verdict.score.toFixed(2) : "ERR"})`);
  }

  const categories = summariseByCategory(results, thresholds);
  const overallPassed = categories.every((c) => c.meetsThresholds);

  const report: EvalReport = {
    startedAt,
    completedAt: new Date().toISOString(),
    actorModel: ACTOR_MODEL,
    judgeModel: JUDGE_MODEL,
    results,
    categories,
    overallPassed,
  };

  const outDir = join(__dirname, "..", "evals", "out");
  await writeFile(join(__dirname, "out", "report.json"), JSON.stringify(report, null, 2), {
    flag: "w",
  }).catch(async () => {
    const { mkdir } = await import("node:fs/promises");
    await mkdir(outDir, { recursive: true });
    await writeFile(join(__dirname, "out", "report.json"), JSON.stringify(report, null, 2));
  });
  await writeFile(join(__dirname, "out", "report.md"), buildMarkdownSummary(report));

  console.log("\n[evals] summary:");
  for (const cat of categories) {
    console.log(
      `  ${cat.category.padEnd(12)} ${cat.passed}/${cat.total} (${(cat.passRate * 100).toFixed(1)}%) avg=${cat.averageScore.toFixed(2)} → ${cat.meetsThresholds ? "PASS" : "FAIL"}`,
    );
  }
  console.log(`\n[evals] overall: ${overallPassed ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`[evals] wrote ${join(__dirname, "out", "report.json")} and report.md`);

  process.exit(overallPassed ? 0 : 1);
}

main().catch((error) => {
  console.error("[evals] crashed:", error);
  process.exit(1);
});
