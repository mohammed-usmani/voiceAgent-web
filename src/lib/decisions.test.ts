import { describe, expect, it } from "vitest";
import { summary } from "@/test/fixtures";
import { finalResult, latestByCandidate } from "./decisions";

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
