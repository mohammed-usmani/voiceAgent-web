import type { DecisionResult, EvalCall, EvalRunSummary, MetricValue } from "./api/types";
import { formatMetric, formatUsd } from "./format";

export type MetricFormat = "ratio" | "count" | "usd" | "pass";
/** true: higher is better · false: lower is better · null: neither (e.g. how often it asks a human). */
type Direction = boolean | null;
type MetricDef = [key: string, label: string, format: MetricFormat, higherIsBetter: Direction];

const STAGES: { id: string; title: string; blurb: string; metrics: MetricDef[] }[] = [
  { id: "criteria", title: "Criteria", blurb: "The criteria agent against hand-labelled criteria", metrics: [
    ["criteria.recall", "Recall", "ratio", true],
    ["criteria.precision", "Precision", "ratio", true],
    ["criteria.hard_flag_accuracy", "Must-have flags", "ratio", true],
    ["criteria.rule_correctness", "Rules", "ratio", true],
    ["criteria.illegal_dropped", "Illegal lines dropped", "ratio", true],
  ] },
  { id: "capture", title: "Answer capture", blurb: "Answers taken from each transcript", metrics: [
    ["capture.accuracy", "Accuracy", "ratio", true],
    ["capture.missed_per_call", "Missed per call", "count", false],
    ["capture.reasked_per_call", "Re-asked per call", "count", false],
  ] },
  { id: "decisions", title: "Decisions", blurb: "Results against what a recruiter would decide", metrics: [
    ["decision.accuracy", "Accuracy", "ratio", true],
    ["decision.false_rejection_rate", "False rejections", "ratio", false],
    ["decision.needs_review_rate", "Sent to review", "ratio", null],
    ["decision.end_reason_accuracy", "End reasons", "ratio", true],
    ["decision.consistency", "Consistency across runs", "ratio", true],
  ] },
  { id: "conversation", title: "Conversation", blurb: "A judge reads every call against a checklist", metrics: [
    ["judge.disclosed_ai_and_recording", "Disclosed AI and recording", "ratio", true],
    ["judge.asked_all_required", "Asked every question", "ratio", true],
    ["judge.never_reasked", "Never re-asked", "ratio", true],
    ["judge.never_hinted_decision", "Never hinted a decision", "ratio", true],
    ["judge.never_promised", "Never promised anything", "ratio", true],
    ["judge.answered_from_job_facts_only", "Answered from job facts", "ratio", true],
    ["judge.professional", "Professional", "ratio", true],
    ["judge.correct_close", "Closed correctly", "ratio", true],
  ] },
  { id: "messages", title: "Messages", blurb: "The outcome emails, judged", metrics: [
    ["message.professional", "Professional", "ratio", true],
    ["message.no_promises", "No promises", "ratio", true],
    ["message.rejection_gives_no_reasons", "Rejections give no reasons", "ratio", true],
    ["message.unresolved_checker_issues", "Unresolved checker issues", "ratio", false],
  ] },
  { id: "reviewer", title: "Reviewer", blurb: "The second agent that checks results", metrics: [
    ["reviewer.wrong_invites_caught", "Wrong invites caught", "count", true],
    ["reviewer.wrong_invites_let_through", "Wrong invites let through", "count", false],
    ["reviewer.needless_invites_escalated", "Needless escalations", "count", false],
    ["reviewer.wrong_rejections_caught", "Wrong rejections caught", "count", true],
    ["reviewer.wrong_rejections_let_through", "Wrong rejections let through", "count", false],
  ] },
  { id: "calibration", title: "Calibration", blurb: "Agreement with the recruiter, before and with overrides", metrics: [
    ["calibration.accuracy_before", "Before overrides", "ratio", true],
    ["calibration.accuracy_after", "With overrides", "ratio", true],
    ["calibration.borderline.accuracy_before", "Borderline, before", "ratio", true],
    ["calibration.borderline.accuracy_after", "Borderline, with overrides", "ratio", true],
  ] },
  { id: "fairness", title: "Fairness", blurb: "One persona replayed under four names", metrics: [
    ["fairness.passed", "Same decision, scores within 0.05", "pass", true],
    ["fairness.score_spread", "Score spread", "ratio", false],
  ] },
  { id: "cost", title: "Cost", blurb: "Model spend for the whole run", metrics: [
    ["cost.usd", "Run total", "usd", false],
    ["cost.per_call_usd", "Per call", "usd", false],
    ["calls.n", "Calls", "count", null],
    ["calls.errors", "Errors", "count", false],
  ] },
];

const DEFS = new Map(STAGES.flatMap((s) => s.metrics.map((m) => [m[0], m] as const)));

export interface StageMetric {
  key: string;
  label: string;
  format: MetricFormat;
  higherIsBetter: Direction;
  value: MetricValue;
}
export interface Stage {
  id: string;
  title: string;
  blurb: string;
  metrics: StageMetric[];
}

export function stageCards(summary: Record<string, MetricValue>): Stage[] {
  return STAGES.map((s) => ({
    id: s.id,
    title: s.title,
    blurb: s.blurb,
    metrics: s.metrics.map(([key, label, format, higherIsBetter]) => ({ key, label, format, higherIsBetter, value: summary[key] ?? null })),
  }));
}

export function metricLabel(key: string): string {
  const def = DEFS.get(key);
  return def ? `${STAGES.find((s) => s.metrics.includes(def))?.title}: ${def[1]}` : key;
}

export function isBetter(key: string, delta: number): boolean | null {
  const dir = DEFS.get(key)?.[3] ?? null;
  if (dir === null || delta === 0) return null;
  return dir === delta > 0;
}

export function formatMetricValue(m: { format: MetricFormat; value: MetricValue }): string {
  if (m.format === "pass") return m.value === true ? "pass" : m.value === false ? "fail" : "incomplete";
  if (typeof m.value !== "number") return formatMetric(m.value);
  if (m.format === "usd") return formatUsd(m.value);
  if (m.format === "count") return Number.isInteger(m.value) ? String(m.value) : m.value.toFixed(2);
  return m.value.toFixed(2);
}

export const OUTCOMES = ["suitable", "not_suitable", "needs_review", "none"] as const;
export type Outcome = (typeof OUTCOMES)[number];
const outcomeOf = (r: DecisionResult | null | undefined): Outcome => r ?? "none";

export function decisionMatrix(calls: EvalCall[]): { cells: Record<Outcome, Record<Outcome, number>>; agree: number; total: number } {
  const row = (): Record<Outcome, number> => ({ suitable: 0, not_suitable: 0, needs_review: 0, none: 0 });
  const cells: Record<Outcome, Record<Outcome, number>> = { suitable: row(), not_suitable: row(), needs_review: row(), none: row() };
  let agree = 0;
  let total = 0;
  for (const c of calls) {
    if (c.persona.expected_decision === null) continue;
    const expected = outcomeOf(c.persona.expected_decision);
    const actual = outcomeOf(c.assessment?.result);
    cells[expected][actual] += 1;
    total += 1;
    if (expected === actual) agree += 1;
  }
  return { cells, agree, total };
}

export interface PersonaRow {
  key: string;
  job: string;
  name: string;
  kind: string;
  expected: Outcome | null;
  actual: Outcome;
  expectedEnd: string | null;
  endReason: string | null;
  error: string | null;
  match: boolean;
  call: EvalCall;
}

export function personaRows(calls: EvalCall[]): PersonaRow[] {
  return calls.map((c, i) => {
    const expected = c.persona.expected_decision === null ? null : outcomeOf(c.persona.expected_decision);
    const actual = outcomeOf(c.assessment?.result);
    const endReason = c.call?.end_reason ?? null;
    const match = expected !== null ? expected === actual : endReason !== null && endReason === c.persona.expected_end;
    return { key: `${c.job}:${c.persona.key}:${c.run}:${i}`, job: c.job, name: c.persona.name, kind: c.persona.kind, expected, actual, expectedEnd: c.persona.expected_end, endReason, error: c.error, match, call: c };
  });
}

export function compareSummaries(a: Record<string, MetricValue>, b: Record<string, MetricValue>): { metric: string; a: MetricValue; b: MetricValue; delta: number | null }[] {
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
  return keys.map((metric) => {
    const x = a[metric] ?? null;
    const y = b[metric] ?? null;
    const delta = typeof x === "number" && typeof y === "number" ? Math.round((y - x) * 10_000) / 10_000 : null;
    return { metric, a: x, b: y, delta };
  });
}

export function visibleRuns(runs: EvalRunSummary[], showOffline: boolean): EvalRunSummary[] {
  return runs.filter((r) => showOffline || !r.offline).sort((x, y) => y.name.localeCompare(x.name));
}

/** For each run, the (up to three) headline metrics that moved most since the previous run
 * of the same kind (real or offline). Run names are UTC timestamps, so they sort in time. */
export function headlineChanges(runs: EvalRunSummary[]): Map<string, { metric: string; delta: number }[]> {
  const out = new Map<string, { metric: string; delta: number }[]>();
  const sorted = [...runs].sort((x, y) => x.name.localeCompare(y.name));
  sorted.forEach((r, i) => {
    const prev = sorted.slice(0, i).reverse().find((p) => p.offline === r.offline);
    const changes = prev
      ? compareSummaries(prev.headline, r.headline)
          .flatMap(({ metric, delta }) => (delta !== null && Math.abs(delta) >= 0.001 ? [{ metric, delta }] : []))
          .sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta))
          .slice(0, 3)
      : [];
    out.set(r.name, changes);
  });
  return out;
}
