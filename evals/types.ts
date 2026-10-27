import { z } from "zod";

import type { Mood } from "../src/lib/chat/mood";

export const EvalCategorySchema = z.enum(["factual", "adversarial", "edge-case"]);
export type EvalCategory = z.infer<typeof EvalCategorySchema>;

export const EvalCaseSchema = z.object({
  id: z.string(),
  category: EvalCategorySchema,
  subcategory: z.string(),
  question: z.string(),
  expected_facts: z.array(z.string()).optional(),
  forbidden_patterns: z.array(z.string()).optional(),
  required_behavior: z.string().optional(),
  /** ISO date the case pretends is today, so answers that depend on the date repeat. */
  today: z.iso.date().optional(),
  /** Earlier turns, for follow-ups that only make sense in a conversation. */
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), text: z.string() })).optional(),
});
export type EvalCase = z.infer<typeof EvalCaseSchema>;

export interface ActorResult {
  case: EvalCase;
  answer: string;
  /** The mood tag the raw reply opened with; null when it had none, which fails the case. */
  mood: Mood | null;
  retrievedContext: string;
  contextLength: number;
  durationMs: number;
}

export const JudgeVerdictSchema = z.object({
  criteria: z.record(z.string(), z.number()),
  score: z.number(),
  reasoning: z.string(),
});
export type JudgeVerdict = z.infer<typeof JudgeVerdictSchema>;

export interface EvalResult {
  case: EvalCase;
  actor: ActorResult;
  judge: JudgeVerdict | { error: string };
  passed: boolean;
}

export interface CategorySummary {
  category: EvalCategory;
  total: number;
  passed: number;
  averageScore: number;
  passRate: number;
  thresholds: { min_pass_rate: number; min_average_score: number };
  meetsThresholds: boolean;
}

export interface EvalReport {
  startedAt: string;
  completedAt: string;
  actorModel: string;
  judgeModel: string;
  results: EvalResult[];
  categories: CategorySummary[];
  overallPassed: boolean;
}
