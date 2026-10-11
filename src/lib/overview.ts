import type { ActiveCall, CampaignStatus, Candidate, DecisionSummary, Job } from "./api/types";
import { finalResult } from "./decisions";

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

export type NextStep =
  | { kind: "live"; label: string }
  | { kind: "link"; label: string; href: string; urgent: boolean }
  | { kind: "none"; label: string };

export interface JobProgress {
  live: number;
  pendingReview: number;
  candidates: number;
  campaign: CampaignStatus | null; // null: never started
}

/** The one thing a recruiter should do next on a job, for the "Next step" column. */
export function nextStep(job: Pick<Job, "id" | "status">, p: JobProgress): NextStep {
  const tab = (t: string) => `/jobs/${job.id}?tab=${t}`;
  if (p.live > 0) return { kind: "live", label: p.live === 1 ? "1 call live" : `${p.live} calls live` };
  switch (job.status) {
    case "generating":
      return { kind: "link", label: "Drafting criteria…", href: tab("criteria"), urgent: false };
    case "criteria_failed":
      return { kind: "link", label: "Retry criteria", href: tab("criteria"), urgent: true };
    case "criteria_ready":
      return { kind: "link", label: "Approve criteria", href: tab("criteria"), urgent: true };
    case "closed":
      return { kind: "none", label: "Closed" };
  }
  if (p.pendingReview > 0) return { kind: "link", label: `Review ${p.pendingReview}`, href: tab("decisions"), urgent: true };
  if (p.candidates === 0) return { kind: "link", label: "Add candidates", href: tab("candidates"), urgent: true };
  if (p.campaign === null) return { kind: "link", label: "Start calling", href: tab("campaign"), urgent: true };
  if (p.campaign === "paused") return { kind: "link", label: "Resume calling", href: tab("campaign"), urgent: true };
  if (p.campaign === "active") return { kind: "link", label: "Calling…", href: tab("campaign"), urgent: false };
  return { kind: "none", label: "All decided" };
}

const SCREENED = new Set(["screened", "decided", "notified"]);

/** Candidates whose call is done, out of all of a job's candidates. */
export function screenedCount(candidates: Pick<Candidate, "status">[]): number {
  return candidates.filter((c) => SCREENED.has(c.status)).length;
}
