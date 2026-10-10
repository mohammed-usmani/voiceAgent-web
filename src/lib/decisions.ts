import type { DecisionResult, DecisionSummary } from "./api/types";

export const RESULT_LABEL: Record<DecisionResult, string> = {
  suitable: "Suitable",
  not_suitable: "Not suitable",
  needs_review: "Needs review",
};

export function finalResult(d: Pick<DecisionSummary, "result" | "final_result">): DecisionResult {
  return d.final_result ?? d.result;
}

export function latestByCandidate(decisions: DecisionSummary[]): Map<string, DecisionSummary> {
  const latest = new Map<string, DecisionSummary>();
  for (const d of decisions) {
    const current = latest.get(d.candidate_id);
    if (!current || Date.parse(d.created_at) > Date.parse(current.created_at)) latest.set(d.candidate_id, d);
  }
  return latest;
}
