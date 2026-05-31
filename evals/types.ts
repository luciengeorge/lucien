import { z } from "zod";

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
});
export type EvalCase = z.infer<typeof EvalCaseSchema>;

export interface ActorResult {
  case: EvalCase;
  answer: string;
  retrievedContext: string;
  contextLength: number;
  expandedQuery: string;
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
