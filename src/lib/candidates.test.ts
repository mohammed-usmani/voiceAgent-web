import { describe, expect, it } from "vitest";
import { call, candidate } from "@/test/fixtures";
import { candidateActions, hasActiveCall, lastCall } from "./candidates";

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
