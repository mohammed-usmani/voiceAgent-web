import { describe, expect, it } from "vitest";
import type { ActiveCall } from "@/lib/api/types";
import { call as baseCall } from "@/test/fixtures";
import { dockView, type FocusAction, type FocusState, focusReducer, initialFocus, newlyDocked, resultLine, wallView } from "./focus";

const active = (id: string, startedAt: string): ActiveCall => ({
  ...baseCall({ id, candidate_id: `cand-${id}`, status: "in_progress", started_at: startedAt, ended_at: null, end_reason: null, room: `room-${id}` }),
  candidate_name: `Candidate ${id}`,
  job_id: "j1",
  job_title: "Support",
});

const run = (actions: FocusAction[], from: FocusState = initialFocus) => actions.reduce(focusReducer, from);
const sync = (...calls: ActiveCall[]): FocusAction => ({ type: "sync", calls, now: Date.parse("2026-10-10T09:30:00Z") });
const A = active("a", "2026-10-10T09:20:00Z");
const B = active("b", "2026-10-10T09:22:00Z");
const C = active("c", "2026-10-10T09:25:00Z");

describe("focus rules", () => {
  it("gives the first call answered the focus", () => {
    const s = run([sync(A)]);
    expect(s.focusedId).toBe("a");
    expect(s.calls.a).toMatchObject({ candidateName: "Candidate a", phase: "live", room: "room-a" });
  });

  it("docks later calls without stealing focus", () => {
    const before = run([sync(A)]);
    const after = focusReducer(before, sync(A, B));
    expect(after.focusedId).toBe("a");
    expect(dockView(after).shown.map((c) => c.id)).toEqual(["b"]);
    expect(newlyDocked(before, after).map((c) => c.id)).toEqual(["b"]);
  });

  it("on load, focuses the longest-running call", () => {
    const s = run([sync(C, A, B)]);
    expect(s.focusedId).toBe("a");
    expect(s.order).toEqual(["a", "b", "c"]);
  });

  it("shows three docked calls plus a count", () => {
    const calls = ["a", "b", "c", "d", "e"].map((id, i) => active(id, `2026-10-10T09:2${i}:00Z`));
    const dock = dockView(run([sync(...calls)]));
    expect(dock.shown.map((c) => c.id)).toEqual(["b", "c", "d"]);
    expect(dock.more).toBe(1);
  });

  it("shows at most ten calls on the wall", () => {
    const calls = Array.from({ length: 12 }, (_, i) => active(`x${i}`, `2026-10-10T09:${String(10 + i)}:00Z`));
    expect(wallView(run([sync(...calls)]))).toHaveLength(10);
  });

  it("focuses a call that is clicked", () => {
    expect(run([sync(A, B), { type: "focus", callId: "b" }]).focusedId).toBe("b");
  });

  it("keeps an ended focused call ~5 s, then moves to the longest-running call", () => {
    const ended = run([sync(A, B, C), { type: "ended", callId: "a", reason: "completed", now: 1 }]);
    expect(ended.focusedId).toBe("a");
    expect(ended.calls.a.phase).toBe("ended");
    expect(resultLine(ended.calls.a)).toBe("Completed · assessing…");
    const moved = focusReducer(ended, { type: "advance", callId: "a" });
    expect(moved.focusedId).toBe("b");
    expect(moved.calls.a).toBeUndefined();
  });

  it("keeps the result card for the verdict when no other call is live", () => {
    const s = run([
      sync(A),
      { type: "ended", callId: "a", reason: "completed", now: 1 },
      { type: "advance", callId: "a" },
      { type: "decided", callId: "a", decisionId: "d1", result: "suitable" },
    ]);
    expect(s.focusedId).toBe("a");
    expect(s.calls.a.decision).toEqual({ id: "d1", result: "suitable" });
    expect(focusReducer(s, { type: "dismiss", callId: "a" }).focusedId).toBeNull();
  });

  it("drops the result card once its decision is approved, overridden or opened", () => {
    const decided = run([
      sync(A),
      { type: "ended", callId: "a", reason: "completed", now: 1 },
      { type: "decided", callId: "a", decisionId: "d1", result: "needs_review" },
    ]);
    expect(focusReducer(decided, { type: "settled", decisionId: "other" })).toBe(decided);
    const settled = focusReducer(decided, { type: "settled", decisionId: "d1" });
    expect(settled.focusedId).toBeNull();
    expect(settled.calls.a).toBeUndefined();
  });

  it("hands the focus to a live call when the result card is settled", () => {
    const s = run([
      sync(A, B),
      { type: "ended", callId: "a", reason: "completed", now: 1 },
      { type: "decided", callId: "a", decisionId: "d1", result: "suitable" },
      { type: "settled", decisionId: "d1" },
    ]);
    expect(s.focusedId).toBe("b");
    expect(s.calls.b.phase).toBe("live");
  });

  it("never lets a settled decision displace a live call", () => {
    // a decision can't belong to a live call, but if events arrive out of order the call stays
    const s = run([sync(A), { type: "decided", callId: "a", decisionId: "d1", result: "suitable" }]);
    expect(focusReducer(s, { type: "settled", decisionId: "d1" })).toBe(s);
  });

  it("drops a docked call from the dock when it ends", () => {
    const s = run([sync(A, B), { type: "ended", callId: "b", reason: "no_answer", now: 1 }]);
    expect(s.calls.b).toBeUndefined();
    expect(dockView(s).shown).toEqual([]);
  });

  it("treats a live call missing from the list as ended", () => {
    const s = run([sync(A, B), sync(B)]);
    expect(s.focusedId).toBe("a");
    expect(s.calls.a.phase).toBe("ended");
    expect(s.calls.a.endReason).toBeNull();
  });

  it("lets a new call take the focus from a finished one", () => {
    const s = run([sync(A), { type: "ended", callId: "a", reason: "completed", now: 1 }, sync(B)]);
    expect(s.focusedId).toBe("b");
    expect(s.calls.a).toBeUndefined();
  });

  it("ignores events for calls it doesn't show", () => {
    const s = run([sync(A)]);
    expect(focusReducer(s, { type: "ended", callId: "zzz", reason: "completed", now: 1 })).toBe(s);
    expect(focusReducer(s, { type: "decided", callId: "zzz", decisionId: "d", result: "suitable" })).toBe(s);
  });

  it("words how a call ended", () => {
    const s = run([sync(A), { type: "ended", callId: "a", reason: "declined_consent", now: 1 }, { type: "notAssessed", callId: "a" }]);
    expect(resultLine(s.calls.a)).toBe("Declined consent · not assessed");
    const failed = run([sync(A), { type: "ended", callId: "a", reason: "failed", now: 1 }]);
    expect(resultLine(failed.calls.a)).toBe("Failed");
    const gone = run([sync(A), sync()]);
    expect(resultLine(gone.calls.a)).toBe("Call ended");
  });
});
