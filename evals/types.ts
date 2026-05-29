export type EvalCategory = "factual" | "adversarial" | "edge-case";

export interface EvalCase {
  id: string;
  category: EvalCategory;
  subcategory: string;
  question: string;
  expected_facts?: string[];
  forbidden_patterns?: string[];
  required_behavior?: string;
}

export interface ActorResult {
  case: EvalCase;
  answer: string;
  retrievedContext: string;
  contextLength: number;
  expandedQuery: string;
  durationMs: number;
}

export interface JudgeVerdict {
  criteria: Record<string, number>;
  score: number;
  reasoning: string;
}

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
