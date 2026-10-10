import { describe, expect, it } from "vitest";
import { call, candidate } from "@/test/fixtures";
import { boardColumn, groupBoard, localMinutes, nextTry, nextWithinHours, toMinutes, withinHours } from "./campaign";

const hours = { start: "10:00", end: "19:00" };
const kolkata = { calling_hours: hours, timezone: "Asia/Kolkata" };

describe("calling hours", () => {
  it("reads local time in the job's time zone", () => {
    expect(toMinutes("10:30")).toBe(630);
    expect(localMinutes(new Date("2026-10-10T04:00:00Z"), "Asia/Kolkata")).toBe(9 * 60 + 30);
  });

  it("follows daylight saving (New York, 8 March 2026)", () => {
    expect(withinHours(new Date("2026-03-07T15:00:00Z"), hours, "America/New_York")).toBe(true); // 10:00 EST
    expect(withinHours(new Date("2026-03-09T14:00:00Z"), hours, "America/New_York")).toBe(true); // 10:00 EDT
    expect(withinHours(new Date("2026-03-09T13:30:00Z"), hours, "America/New_York")).toBe(false); // 09:30 EDT
    expect(withinHours(new Date("2026-03-09T23:00:00Z"), hours, "America/New_York")).toBe(false); // 19:00 EDT
  });

  it("moves a time into the next calling window", () => {
    expect(nextWithinHours(new Date("2026-10-10T04:00:00Z"), hours, "Asia/Kolkata").toISOString()).toBe("2026-10-10T04:30:00.000Z");
    expect(nextWithinHours(new Date("2026-10-10T13:45:00Z"), hours, "Asia/Kolkata").toISOString()).toBe("2026-10-11T04:30:00.000Z");
    const inside = new Date("2026-10-10T06:00:00Z");
    expect(nextWithinHours(inside, hours, "Asia/Kolkata")).toBe(inside);
  });
});

describe("nextTry", () => {
  it("retries an unanswered call 2 hours later, inside calling hours", () => {
    const last = call({ status: "no_answer", end_reason: null, ended_at: "2026-10-10T08:00:00Z" });
    expect(nextTry(candidate("c", "no_answer"), last, kolkata)).toEqual({ kind: "retry", at: new Date("2026-10-10T10:00:00Z") });
    const late = call({ status: "no_answer", end_reason: null, ended_at: "2026-10-10T12:30:00Z" }); // +2 h = 20:00 IST
    expect(nextTry(candidate("c", "no_answer"), late, kolkata)?.at.toISOString()).toBe("2026-10-11T04:30:00.000Z");
  });

  it("uses the time a candidate asked to be called back", () => {
    const last = call({ end_reason: "callback_requested", callback_at: "2026-10-10T11:30:00Z" });
    expect(nextTry(candidate("c", "callback"), last, kolkata)).toEqual({ kind: "callback", at: new Date("2026-10-10T11:30:00Z") });
  });

  it("has nothing planned when calling is stopped or the candidate is done", () => {
    const last = call({ status: "no_answer", ended_at: "2026-10-10T08:00:00Z" });
    expect(nextTry(candidate("c", "no_answer", { excluded_at: "2026-10-10T09:00:00Z" }), last, kolkata)).toBeNull();
    expect(nextTry(candidate("c", "decided"), call(), kolkata)).toBeNull();
  });
});

describe("board", () => {
  it("puts each candidate in one column", () => {
    expect(boardColumn(candidate("c", "pending"), null)).toBe("queued");
    expect(boardColumn(candidate("c", "calling"), call({ status: "ringing" }))).toBe("ringing");
    expect(boardColumn(candidate("c", "calling"), call({ status: "in_progress" }))).toBe("on_call");
    expect(boardColumn(candidate("c", "no_answer"), call({ status: "no_answer" }))).toBe("retrying");
    expect(boardColumn(candidate("c", "callback"), call())).toBe("callback");
    expect(boardColumn(candidate("c", "unreachable"), call({ status: "no_answer" }))).toBe("unreachable");
    expect(boardColumn(candidate("c", "notified"), call())).toBe("done");
  });

  it("groups candidates with their latest call", () => {
    const board = groupBoard([candidate("a", "pending"), candidate("b", "decided")], { b: [call({ attempt: 1 }), call({ attempt: 2 })] });
    expect(board.queued.map((x) => x.candidate.id)).toEqual(["a"]);
    expect(board.done[0].last?.attempt).toBe(2);
    expect(board.ringing).toEqual([]);
  });
});
