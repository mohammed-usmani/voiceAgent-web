import type { Decision, DecisionResult, DecisionSummary, Requirement, Verdict } from "./api/types";
import { humanize } from "./format";
import { ruleText } from "./rules";
import type { Tone } from "./status";

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

/** The review queue: pending first (oldest first, as the backend's queue), then the rest newest first. */
export function queueOrder(decisions: DecisionSummary[]): DecisionSummary[] {
  const pending = decisions.filter((d) => d.status === "pending_review").sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
  const rest = decisions.filter((d) => d.status !== "pending_review").sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  return [...pending, ...rest];
}

export const LOW_CONFIDENCE = 0.6; // below this a must-have counts as unanswered (voiceAgent db/models.py)

export interface DecisionRow {
  id: string;
  label: string;
  hard: boolean;
  verdict: Verdict;
  score: number | null;
  quote: string;
  confidence: number;
  rule: string;
  failedHard: boolean;
  inconsistency: string | null;
}

export function decisionRows(d: Pick<Decision, "reasons" | "answers" | "hard_failures">, requirements: Requirement[]): DecisionRow[] {
  const byId = new Map(requirements.map((r) => [r.id, r]));
  const answers = new Map(d.answers.map((a) => [a.requirement_id, a]));
  return d.reasons.map((reason) => {
    const r = byId.get(reason.requirement_id);
    const a = answers.get(reason.requirement_id);
    return {
      id: reason.requirement_id,
      label: r?.label ?? humanize(reason.requirement_id),
      hard: r?.hard ?? false,
      verdict: reason.verdict,
      score: reason.score,
      quote: reason.quote || a?.quote || "",
      confidence: reason.confidence,
      rule: r ? ruleText(r) : "—",
      failedHard: d.hard_failures.includes(reason.requirement_id),
      inconsistency: a?.inconsistency ?? null,
    };
  });
}

export function verdictView(row: Pick<DecisionRow, "verdict" | "score">): { label: string; tone: Tone } {
  switch (row.verdict) {
    case "pass":
      return { label: "Pass", tone: "teal" };
    case "fail":
      return { label: "Fail", tone: "rose" };
    case "declined":
      return { label: "Declined", tone: "muted" };
    case "scored":
      return { label: `Score ${(row.score ?? 0).toFixed(2)}`, tone: (row.score ?? 0) >= 0.5 ? "teal" : "amber" };
    default:
      return { label: "Unknown", tone: "amber" };
  }
}

const REVIEWABLE = new Set(["pending_review", "overridden"]);

export function canOverride(d: Pick<Decision, "status" | "message">): boolean {
  return REVIEWABLE.has(d.status) || (d.status === "approved" && d.message?.status === "failed");
}

/** Mirrors POST /decisions/{id}:approve's 409s, so the button says why before it's clicked. */
export function canApprove(d: Decision): { allowed: boolean; reason: string | null } {
  const no = (reason: string) => ({ allowed: false, reason });
  if (d.status === "sent") return no("Already sent");
  if (finalResult(d) === "needs_review") return no("Choose a result with Override first");
  if (!d.message) return no("The message is still being drafted");
  if (d.message.status !== "draft" && d.message.status !== "failed") return no(`The message is ${d.message.status}`);
  if (!canOverride(d)) return no(`The decision is ${humanize(d.status).toLowerCase()}`);
  return { allowed: true, reason: null };
}
