import { describe, expect, it } from "vitest";
import type { Decision, Message } from "@/lib/api/types";
import { requirement, summary } from "@/test/fixtures";
import { canApprove, canOverride, decisionRows, finalResult, latestByCandidate, queueOrder, verdictView } from "./decisions";

describe("decisions", () => {
  it("prefers the recruiter's result", () => {
    expect(finalResult(summary({ result: "needs_review", final_result: "not_suitable" }))).toBe("not_suitable");
    expect(finalResult(summary({ result: "needs_review" }))).toBe("needs_review");
  });

  it("keeps each candidate's latest decision", () => {
    const old = summary({ id: "a", created_at: "2026-10-09T08:00:00Z" });
    const recall = summary({ id: "b", created_at: "2026-10-10T08:00:00Z" });
    const other = summary({ id: "c", candidate_id: "c2" });
    const latest = latestByCandidate([recall, old, other]);
    expect(latest.get("c1")?.id).toBe("b");
    expect(latest.get("c2")?.id).toBe("c");
  });
});

describe("queueOrder", () => {
  it("puts what needs review first, oldest first, then the rest newest first", () => {
    const ds = [
      summary({ id: "sent-old", status: "sent", created_at: "2026-10-08T08:00:00Z" }),
      summary({ id: "pending-new", created_at: "2026-10-10T08:00:00Z" }),
      summary({ id: "sent-new", status: "sent", created_at: "2026-10-09T08:00:00Z" }),
      summary({ id: "pending-old", created_at: "2026-10-09T07:00:00Z" }),
    ];
    expect(queueOrder(ds).map((d) => d.id)).toEqual(["pending-old", "pending-new", "sent-new", "sent-old"]);
  });
});

const message = (over: Partial<Message> = {}): Message => ({
  id: "m1",
  decision_id: "d1",
  kind: "invite",
  to: "ananya@example.com",
  subject: "Next steps",
  body: "Dear Ananya,",
  status: "draft",
  issues: [],
  sent_at: null,
  error: null,
  updated_at: "2026-10-10T08:00:00Z",
  ...over,
});

const decision = (over: Partial<Decision> = {}): Decision => ({
  ...summary(),
  criteria_version_id: "cv1",
  hard_failures: [],
  reasons: [],
  model: "m",
  reviewer_note: null,
  agent_review: null,
  trace: [],
  answers: [],
  message: message(),
  ...over,
});

describe("decisionRows", () => {
  it("joins reasons with the requirements and answers", () => {
    const d = decision({
      hard_failures: ["intl_voice_years"],
      reasons: [
        { requirement_id: "intl_voice_years", verdict: "fail", score: null, quote: "about six months", confidence: 0.9, note: "" },
        { requirement_id: "gone_now", verdict: "scored", score: 0.8, quote: "", confidence: 0.5, note: "" },
      ],
      answers: [
        { requirement_id: "intl_voice_years", value: 0.5, declined: false, quote: "about six months", confidence: 0.9, inconsistency: "the résumé says 2 years" },
        { requirement_id: "gone_now", value: "x", declined: false, quote: "from the answer", confidence: 0.5, inconsistency: null },
      ],
    });
    const rows = decisionRows(d, [requirement()]);
    expect(rows[0]).toMatchObject({ label: "International voice experience", hard: true, rule: "At least 1 year", failedHard: true, inconsistency: "the résumé says 2 years" });
    expect(rows[1]).toMatchObject({ label: "Gone now", rule: "—", quote: "from the answer", failedHard: false });
  });
});

describe("verdictView", () => {
  it("words each verdict", () => {
    expect(verdictView({ verdict: "pass", score: null })).toEqual({ label: "Pass", tone: "teal" });
    expect(verdictView({ verdict: "fail", score: null })).toEqual({ label: "Fail", tone: "rose" });
    expect(verdictView({ verdict: "unknown", score: null })).toEqual({ label: "Unknown", tone: "amber" });
    expect(verdictView({ verdict: "declined", score: null })).toEqual({ label: "Declined", tone: "muted" });
    expect(verdictView({ verdict: "scored", score: 0.75 })).toEqual({ label: "Score 0.75", tone: "teal" });
    expect(verdictView({ verdict: "scored", score: 0.25 })).toEqual({ label: "Score 0.25", tone: "amber" });
  });
});

describe("canApprove / canOverride", () => {
  it("allows sending a drafted message for a decided result", () => {
    expect(canApprove(decision())).toEqual({ allowed: true, reason: null });
  });

  it("explains why it can't send", () => {
    expect(canApprove(decision({ result: "needs_review", message: null })).reason).toBe("Choose a result with Override first");
    expect(canApprove(decision({ message: null })).reason).toBe("The message is still being drafted");
    expect(canApprove(decision({ status: "sent", message: message({ status: "sent" }) })).reason).toBe("Already sent");
    expect(canApprove(decision({ status: "approved", message: message({ status: "queued" }) })).reason).toBe("The message is queued");
  });

  it("allows retrying a failed send", () => {
    expect(canApprove(decision({ status: "approved", message: message({ status: "failed" }) })).allowed).toBe(true);
    expect(canOverride(decision({ status: "approved", message: message({ status: "failed" }) }))).toBe(true);
  });

  it("allows overriding only while in review", () => {
    expect(canOverride(decision())).toBe(true);
    expect(canOverride(decision({ status: "overridden" }))).toBe(true);
    expect(canOverride(decision({ status: "sent" }))).toBe(false);
  });
});
