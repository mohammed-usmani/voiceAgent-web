import type { Call, CallingHours, Candidate, Job } from "./api/types";
import { lastCall } from "./candidates";

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function localMinutes(at: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(at);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return get("hour") * 60 + get("minute");
}

export function withinHours(at: Date, hours: CallingHours, timeZone: string): boolean {
  const m = localMinutes(at, timeZone);
  return toMinutes(hours.start) <= m && m < toMinutes(hours.end);
}

/** `at` if it is inside calling hours, else the start of the next window. */
export function nextWithinHours(at: Date, hours: CallingHours, timeZone: string): Date {
  if (withinHours(at, hours, timeZone)) return at;
  const m = localMinutes(at, timeZone);
  const start = toMinutes(hours.start);
  const wait = m < start ? start - m : 24 * 60 - m + start;
  // ponytail: ignores a daylight-saving change inside the wait; it is a "~" estimate on a card
  const next = new Date(at.getTime() + wait * 60_000);
  next.setUTCSeconds(0, 0);
  return next;
}

export const RETRY_GAP_MS = 2 * 60 * 60 * 1000; // the campaign's retry rule (voiceAgent worker/campaign.py)

export function nextTry(c: Candidate, last: Call | null, job: Pick<Job, "calling_hours" | "timezone">): { kind: "retry" | "callback"; at: Date } | null {
  if (c.excluded_at || !last) return null;
  if (c.status === "callback" && last.callback_at) return { kind: "callback", at: new Date(last.callback_at) };
  if (c.status === "no_answer" && last.ended_at) {
    return { kind: "retry", at: nextWithinHours(new Date(Date.parse(last.ended_at) + RETRY_GAP_MS), job.calling_hours, job.timezone) };
  }
  return null;
}

export type BoardColumn = "queued" | "ringing" | "on_call" | "retrying" | "callback" | "unreachable" | "done";

export const COLUMNS: { id: BoardColumn; label: string }[] = [
  { id: "queued", label: "Queued" },
  { id: "ringing", label: "Ringing" },
  { id: "on_call", label: "On call" },
  { id: "retrying", label: "Retrying" },
  { id: "callback", label: "Callback" },
  { id: "unreachable", label: "Unreachable" },
  { id: "done", label: "Done" },
];

export function boardColumn(c: Candidate, last: Call | null): BoardColumn {
  if (last?.status === "queued") return "queued";
  if (last?.status === "ringing") return "ringing";
  if (last?.status === "in_progress") return "on_call";
  switch (c.status) {
    case "pending":
    case "calling":
      return "queued";
    case "no_answer":
      return "retrying";
    case "callback":
      return "callback";
    case "unreachable":
      return "unreachable";
    default:
      return "done";
  }
}

export interface BoardCard {
  candidate: Candidate;
  last: Call | null;
}

export function groupBoard(candidates: Candidate[], callsByCandidate: Record<string, Call[]>): Record<BoardColumn, BoardCard[]> {
  const board: Record<BoardColumn, BoardCard[]> = { queued: [], ringing: [], on_call: [], retrying: [], callback: [], unreachable: [], done: [] };
  for (const c of candidates) {
    const last = lastCall(callsByCandidate[c.id]);
    board[boardColumn(c, last)].push({ candidate: c, last });
  }
  return board;
}
