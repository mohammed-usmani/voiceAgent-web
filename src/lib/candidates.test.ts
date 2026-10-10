import { describe, expect, it } from "vitest";
import type { Decision } from "@/lib/api/types";
import { call, candidate, summary } from "@/test/fixtures";
import { candidateActions, candidateTimeline, hasActiveCall, lastCall } from "./candidates";

describe("candidateActions", () => {
  it("offers a call to someone not yet screened", () => {
    expect(candidateActions(candidate("c", "pending"), false)).toEqual({ call: "call", exclude: "stop" });
    expect(candidateActions(candidate("c", "no_answer"), false)).toEqual({ call: "call", exclude: "stop" });
  });

  it("asks before calling a screened candidate again", () => {
    expect(candidateActions(candidate("c", "screened"), false).call).toBe("call_again");
    expect(candidateActions(candidate("c", "withdrawn"), false).call).toBe("call_again");
  });

  it("offers no call while one is active", () => {
    expect(candidateActions(candidate("c", "calling"), false).call).toBeNull();
    expect(candidateActions(candidate("c", "pending"), true).call).toBeNull();
  });

  it("offers only Resume calling when calling is stopped", () => {
    expect(candidateActions(candidate("c", "pending", { excluded_at: "2026-10-10T08:00:00Z" }), false)).toEqual({ call: null, exclude: "resume" });
  });
});

describe("calls", () => {
  it("finds the latest attempt and whether it is still active", () => {
    const calls = [call({ attempt: 2, status: "ringing" }), call({ attempt: 1 })];
    expect(lastCall(calls)?.attempt).toBe(2);
    expect(hasActiveCall(calls)).toBe(true);
    expect(lastCall([])).toBeNull();
    expect(hasActiveCall(undefined)).toBe(false);
  });
});


describe("candidateTimeline", () => {
  it("tells the candidate's story from their calls, decision and message, newest first", () => {
    const c = candidate("c1", "notified", { created_at: "2026-10-10T07:00:00Z" });
    const calls = [
      call({ id: "k1", attempt: 1, status: "no_answer", end_reason: null, created_at: "2026-10-10T07:10:00Z", started_at: null, ended_at: "2026-10-10T07:11:00Z" }),
      call({ id: "k2", attempt: 2, created_at: "2026-10-10T09:10:00Z", started_at: "2026-10-10T09:11:00Z", ended_at: "2026-10-10T09:17:00Z" }),
    ];
    const decision = {
      ...summary({ created_at: "2026-10-10T09:18:00Z", result: "suitable" }),
      message: { sent_at: "2026-10-10T09:30:00Z", kind: "invite" },
    } as unknown as Decision;
    expect(candidateTimeline(c, calls, decision).map((i) => [i.at.slice(11, 16), i.text])).toEqual([
      ["09:30", "Invitation sent"],
      ["09:18", "Decision: suitable"],
      ["09:17", "Call 2 ended: completed"],
      ["09:11", "Call 2 answered"],
      ["09:10", "Call 2 queued"],
      ["07:11", "Call 1: no answer"],
      ["07:10", "Call 1 queued"],
      ["07:00", "Added"],
    ]);
  });

  it("shows when calling was stopped", () => {
    const c = candidate("c1", "pending", { excluded_at: "2026-10-10T08:00:00Z" });
    expect(candidateTimeline(c, [], null)[0]).toMatchObject({ text: "Calling stopped", tone: "amber" });
  });
});
