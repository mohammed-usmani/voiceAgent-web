import type { Call, CallStatus, Candidate, CandidateStatus, Decision } from "./api/types";
import { finalResult } from "./decisions";
import { humanize } from "./format";
import type { Tone } from "./status";

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


export interface TimelineItem {
  at: string;
  text: string;
  tone: Tone;
}

const UNANSWERED: readonly CallStatus[] = ["no_answer", "voicemail", "failed"];

/** What happened to a candidate, newest first, from data already on the page. */
export function candidateTimeline(c: Candidate, calls: Call[], decision: Decision | null | undefined): TimelineItem[] {
  const items: TimelineItem[] = [{ at: c.created_at, text: "Added", tone: "muted" }];
  for (const k of calls) {
    items.push({ at: k.created_at, text: `Call ${k.attempt} queued`, tone: "muted" });
    if (k.started_at && !UNANSWERED.includes(k.status)) items.push({ at: k.started_at, text: `Call ${k.attempt} answered`, tone: "teal" });
    if (k.ended_at) {
      const text = UNANSWERED.includes(k.status) ? `Call ${k.attempt}: ${humanize(k.status).toLowerCase()}` : `Call ${k.attempt} ended: ${humanize(k.end_reason ?? k.status).toLowerCase()}`;
      items.push({ at: k.ended_at, text, tone: UNANSWERED.includes(k.status) ? "amber" : "muted" });
    }
  }
  if (decision) {
    items.push({ at: decision.created_at, text: `Decision: ${humanize(finalResult(decision)).toLowerCase()}`, tone: "teal" });
    if (decision.message?.sent_at) {
      items.push({ at: decision.message.sent_at, text: `${decision.message.kind === "invite" ? "Invitation" : "Rejection"} sent`, tone: "teal" });
    }
  }
  if (c.excluded_at) items.push({ at: c.excluded_at, text: "Calling stopped", tone: "amber" });
  return items.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}
