import type { Call, CallStatus, Candidate, CandidateStatus } from "./api/types";

/** Done with calls: calling again needs `force` (voiceAgent db/models.py). */
export const FINISHED_STATUSES: readonly CandidateStatus[] = ["screened", "decided", "notified", "declined_consent", "withdrawn"];
export const ACTIVE_CALL_STATUSES: readonly CallStatus[] = ["queued", "ringing", "in_progress"];

export function lastCall(calls: Call[] | undefined): Call | null {
  if (!calls?.length) return null;
  return calls.reduce((a, b) => (b.attempt > a.attempt ? b : a));
}

export function hasActiveCall(calls: Call[] | undefined): boolean {
  return (calls ?? []).some((c) => ACTIVE_CALL_STATUSES.includes(c.status));
}

export function candidateActions(c: Candidate, activeCall: boolean): { call: "call" | "call_again" | null; exclude: "stop" | "resume" } {
  const exclude = c.excluded_at ? "resume" : "stop";
  if (c.excluded_at || activeCall || c.status === "calling") return { call: null, exclude };
  return { call: FINISHED_STATUSES.includes(c.status) ? "call_again" : "call", exclude };
}
