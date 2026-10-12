import type { EvalCase } from "./types";

/** The date the actor is told it is, which the judge must also use. */
export function evalToday(evalCase: EvalCase): Date {
  return evalCase.today ? new Date(`${evalCase.today}T12:00:00Z`) : new Date();
}
