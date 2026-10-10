import { describe, expect, it } from "vitest";
import type { ActiveCall } from "@/lib/api/types";
import { candidate, summary } from "@/test/fixtures";
import { outcomeBuckets, overviewStats } from "./overview";

describe("overviewStats", () => {
  it("counts today's decisions in the given time zone, and everything awaiting review", () => {
    const now = new Date("2026-10-10T10:00:00Z"); // 15:30 in Kolkata
    const decisions = [
      summary({ id: "a", created_at: "2026-10-10T09:00:00Z" }),
      summary({ id: "b", created_at: "2026-10-09T20:00:00Z", result: "not_suitable" }), // 01:30 on the 10th in Kolkata
      summary({ id: "c", created_at: "2026-10-09T10:00:00Z", status: "sent" }),
      summary({ id: "d", created_at: "2026-10-10T09:30:00Z", result: "needs_review", final_result: "suitable", status: "overridden" }),
    ];
    const active = [{ id: "x" }] as ActiveCall[];
    expect(overviewStats(decisions, active, now, "Asia/Kolkata")).toEqual({
      liveNow: 1,
      screenedToday: 3,
      suitableToday: 2,
      awaitingReview: 2,
    });
  });
});

describe("outcomeBuckets", () => {
  it("counts each candidate once: by latest decision, else by status", () => {
    const decisions = [
      summary({ id: "a", candidate_id: "c1", result: "suitable" }),
      summary({ id: "b", candidate_id: "c2", result: "needs_review", final_result: "not_suitable" }),
    ];
    const candidates = [
      candidate("c1", "decided"),
      candidate("c2", "notified"),
      candidate("c3", "no_answer"),
      candidate("c4", "callback"),
      candidate("c5", "pending"),
    ];
    const counts = Object.fromEntries(outcomeBuckets(decisions, candidates).map((b) => [b.key, b.count]));
    expect(counts).toEqual({
      suitable: 1,
      not_suitable: 1,
      needs_review: 0,
      callback: 1,
      no_answer: 1,
      unreachable: 0,
      declined_consent: 0,
      withdrawn: 0,
    });
  });
});
