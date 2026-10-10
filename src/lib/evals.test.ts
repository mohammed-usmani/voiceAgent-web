import { describe, expect, it } from "vitest";
import type { DecisionResult, EvalCall, EvalRunSummary } from "@/lib/api/types";
import { compareSummaries, decisionMatrix, formatMetricValue, headlineChanges, isBetter, personaRows, stageCards, visibleRuns } from "./evals";

const evalCall = (expected: DecisionResult | null, actual: DecisionResult | null, over: Partial<EvalCall> = {}): EvalCall => ({
  job: "customer-support",
  persona: { key: "p", kind: "clear_fit", name: "Ananya Rao", resume: "", expected_end: "completed", expected_decision: expected },
  run: 0,
  call: { end_reason: "completed", callback_at: null, turns: 7, stopped_by: null, transcript: [] },
  assessment: actual ? { result: actual, score: 1, hard_failures: [], summary: "", reasons: [] } : null,
  message: null,
  judgement: null,
  cost_usd: 0.01,
  error: null,
  ...over,
});

const run = (name: string, offline: boolean, headline: EvalRunSummary["headline"]): EvalRunSummary => ({ name, started_at: "2026-10-09T22:34:14Z", offline, headline, cost_usd: 0.3 });

describe("stageCards", () => {
  it("covers every stage and shows missing or null metrics as gaps", () => {
    const stages = stageCards({ "criteria.recall": 0.8373, "decision.consistency": null, "fairness.passed": null, "cost.per_call_usd": 0.0131 });
    expect(stages.map((s) => s.id)).toEqual(["criteria", "capture", "decisions", "conversation", "messages", "reviewer", "calibration", "fairness", "cost"]);
    const criteria = stages[0].metrics;
    expect(criteria[0]).toMatchObject({ key: "criteria.recall", label: "Recall", value: 0.8373 });
    expect(criteria[1].value).toBeNull();
    const fairness = stages.find((s) => s.id === "fairness")?.metrics[0];
    expect(fairness && formatMetricValue(fairness)).toBe("incomplete");
  });
});

describe("formatMetricValue", () => {
  it("formats by kind", () => {
    expect(formatMetricValue({ format: "ratio", value: 0.6667 })).toBe("0.67");
    expect(formatMetricValue({ format: "count", value: 5 })).toBe("5");
    expect(formatMetricValue({ format: "count", value: 0.05 })).toBe("0.05");
    expect(formatMetricValue({ format: "usd", value: 0.0131 })).toBe("$0.0131");
    expect(formatMetricValue({ format: "pass", value: true })).toBe("pass");
    expect(formatMetricValue({ format: "pass", value: false })).toBe("fail");
    expect(formatMetricValue({ format: "ratio", value: null })).toBe("—");
  });
});

describe("decisionMatrix", () => {
  it("counts expected against actual, with no decision as its own column", () => {
    const m = decisionMatrix([
      evalCall("suitable", "suitable"),
      evalCall("suitable", "needs_review"),
      evalCall("needs_review", null, { call: null, error: "persona: refused" }),
      evalCall(null, null), // a callback persona: no expected decision, not counted
    ]);
    expect(m.cells.suitable.suitable).toBe(1);
    expect(m.cells.suitable.needs_review).toBe(1);
    expect(m.cells.needs_review.none).toBe(1);
    expect(m).toMatchObject({ agree: 1, total: 3 });
  });
});

describe("personaRows", () => {
  it("marks matches, and judges personas without a decision on how the call ended", () => {
    const rows = personaRows([
      evalCall("suitable", "suitable"),
      evalCall("not_suitable", "suitable"),
      evalCall(null, null, { persona: { key: "bad_time", kind: "bad_time", name: "X", resume: "", expected_end: "callback_requested", expected_decision: null }, call: { end_reason: "callback_requested", callback_at: null, turns: 3, stopped_by: null, transcript: [] } }),
      evalCall("needs_review", null, { call: null, error: "persona: refused" }),
    ]);
    expect(rows.map((r) => r.match)).toEqual([true, false, true, false]);
    expect(rows[3]).toMatchObject({ actual: "none", endReason: null, error: "persona: refused" });
    expect(new Set(rows.map((r) => r.key)).size).toBe(4);
  });
});

describe("compareSummaries", () => {
  it("lines up two runs' metrics with the change", () => {
    expect(compareSummaries({ "a.x": 0.5, "a.y": true }, { "a.x": 0.75, "a.z": 2 })).toEqual([
      { metric: "a.x", a: 0.5, b: 0.75, delta: 0.25 },
      { metric: "a.y", a: true, b: null, delta: null },
      { metric: "a.z", a: null, b: 2, delta: null },
    ]);
  });
});

describe("runs", () => {
  it("hides offline runs unless asked, newest first", () => {
    const runs = [run("20261009T192610Z", false, {}), run("20261009T223414Z", false, {}), run("20261009T180000Z", true, {})];
    expect(visibleRuns(runs, false).map((r) => r.name)).toEqual(["20261009T223414Z", "20261009T192610Z"]);
    expect(visibleRuns(runs, true)).toHaveLength(3);
  });

  it("finds what changed most since the previous run of the same kind", () => {
    const changes = headlineChanges([
      run("1", false, { "decision.accuracy": 0.5, "criteria.recall": 0.9, "fairness.passed": true }),
      run("2", true, { "decision.accuracy": 0.1 }),
      run("3", false, { "decision.accuracy": 0.67, "criteria.recall": 0.84, "fairness.passed": false }),
    ]);
    expect(changes.get("3")).toEqual([
      { metric: "decision.accuracy", delta: 0.17 },
      { metric: "criteria.recall", delta: -0.06 },
    ]);
    expect(changes.get("1")).toEqual([]);
  });

  it("knows which way is better", () => {
    expect(isBetter("decision.accuracy", 0.1)).toBe(true);
    expect(isBetter("decision.false_rejection_rate", 0.1)).toBe(false);
    expect(isBetter("decision.needs_review_rate", 0.1)).toBeNull();
  });
});
