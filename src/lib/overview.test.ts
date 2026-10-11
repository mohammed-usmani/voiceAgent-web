import { describe, expect, it } from "vitest";
import type { ActiveCall } from "@/lib/api/types";
import { candidate, summary } from "@/test/fixtures";
import { type JobProgress, nextStep, overviewStats, screenedCount } from "./overview";

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

describe("nextStep", () => {
  const job = (status: Parameters<typeof nextStep>[0]["status"]) => ({ id: "j", status });
  const p = (o: Partial<JobProgress> = {}): JobProgress => ({ live: 0, pendingReview: 0, candidates: 3, campaign: "active", ...o });

  it("puts a live call first, whatever else is going on", () => {
    expect(nextStep(job("active"), p({ live: 2, pendingReview: 4 }))).toEqual({ kind: "live", label: "2 calls live" });
  });

  it("walks a job through setup in order", () => {
    expect(nextStep(job("criteria_ready"), p())).toMatchObject({ label: "Approve criteria", href: "/jobs/j?tab=criteria", urgent: true });
    expect(nextStep(job("active"), p({ candidates: 0, campaign: null }))).toMatchObject({ label: "Add candidates", href: "/jobs/j?tab=candidates" });
    expect(nextStep(job("active"), p({ campaign: null }))).toMatchObject({ label: "Start calling", href: "/jobs/j?tab=campaign" });
    expect(nextStep(job("active"), p({ campaign: "paused" }))).toMatchObject({ label: "Resume calling" });
  });

  it("asks for reviews before anything else on an active job", () => {
    expect(nextStep(job("active"), p({ pendingReview: 2, campaign: null }))).toMatchObject({ label: "Review 2", href: "/jobs/j?tab=decisions" });
  });

  it("has nothing to do once a campaign is done or the job is closed", () => {
    expect(nextStep(job("active"), p({ campaign: "done" }))).toEqual({ kind: "none", label: "All decided" });
    expect(nextStep(job("closed"), p())).toEqual({ kind: "none", label: "Closed" });
  });
});

describe("screenedCount", () => {
  it("counts finished calls only", () => {
    expect(screenedCount([candidate("a", "decided"), candidate("b", "notified"), candidate("c", "no_answer"), candidate("d", "pending")])).toBe(2);
  });
});
