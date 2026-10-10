import type { ActiveCall, Candidate, DecisionSummary } from "./api/types";
import { finalResult, latestByCandidate } from "./decisions";
import type { Tone } from "./status";

export function dayKey(at: Date | string, timeZone?: string): string {
  return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone }).format(new Date(at));
}

export interface OverviewStats {
  liveNow: number;
  screenedToday: number;
  suitableToday: number;
  awaitingReview: number;
}

export function overviewStats(decisions: DecisionSummary[], activeCalls: ActiveCall[], now: Date, timeZone?: string): OverviewStats {
  const today = dayKey(now, timeZone);
  const todays = decisions.filter((d) => dayKey(d.created_at, timeZone) === today);
  return {
    liveNow: activeCalls.length,
    screenedToday: todays.length,
    suitableToday: todays.filter((d) => finalResult(d) === "suitable").length,
    awaitingReview: decisions.filter((d) => d.status === "pending_review").length,
  };
}

export interface OutcomeBucket {
  key: string;
  label: string;
  tone: Tone;
  count: number;
}

const BUCKETS: { key: string; label: string; tone: Tone; from: "result" | "status" }[] = [
  { key: "suitable", label: "Suitable", tone: "teal", from: "result" },
  { key: "not_suitable", label: "Not suitable", tone: "rose", from: "result" },
  { key: "needs_review", label: "Needs review", tone: "amber", from: "result" },
  { key: "callback", label: "Callback", tone: "amber", from: "status" },
  { key: "no_answer", label: "No answer", tone: "muted", from: "status" },
  { key: "unreachable", label: "Unreachable", tone: "rose", from: "status" },
  { key: "declined_consent", label: "Declined", tone: "rose", from: "status" },
  { key: "withdrawn", label: "Withdrew", tone: "muted", from: "status" },
];

/** Each candidate counted once: by their latest decision, else by a call outcome status. */
export function outcomeBuckets(decisions: DecisionSummary[], candidates: Candidate[]): OutcomeBucket[] {
  const latest = latestByCandidate(decisions);
  const counts = new Map<string, number>();
  const bump = (k: string) => counts.set(k, (counts.get(k) ?? 0) + 1);
  for (const d of latest.values()) bump(finalResult(d));
  const statusKeys = new Set(BUCKETS.filter((b) => b.from === "status").map((b) => b.key));
  for (const c of candidates) if (!latest.has(c.id) && statusKeys.has(c.status)) bump(c.status);
  return BUCKETS.map(({ key, label, tone }) => ({ key, label, tone, count: counts.get(key) ?? 0 }));
}
