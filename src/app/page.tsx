"use client";

import { Briefcase, PanelRightOpen, Plus } from "lucide-react";
import Link from "next/link";
import { JobsTable } from "@/components/overview/jobs-table";
import { NeedsYou } from "@/components/overview/needs-you";
import { StatTile } from "@/components/overview/stat-tiles";
import { useActivityToggle } from "@/components/shell/activity-toggle";
import { EmptyState, ErrorState, SkeletonCards } from "@/components/states";
import { Button } from "@/components/ui/button";
import { useActiveCalls, useAllCandidates, useDecisions, useJobs } from "@/lib/api/queries";
import type { LiveCall } from "@/lib/live/focus";
import { useLiveCalls } from "@/lib/live/provider";
import { overviewStats } from "@/lib/overview";
import { useNow } from "@/lib/use-now";

const COUNT = ["Nothing needs you right now.", "One thing needs you.", "Two things need you.", "Three things need you."];

function greeting(at: Date): string {
  const h = at.getHours();
  return h < 12 ? "Good morning." : h < 17 ? "Good afternoon." : "Good evening.";
}

export default function TodayPage() {
  const jobs = useJobs();
  const decisions = useDecisions();
  const active = useActiveCalls();
  const candidates = useAllCandidates(jobs.data);
  const { state } = useLiveCalls();
  const showActivity = useActivityToggle();
  const now = useNow(60_000);

  const live = state.order.map((id) => state.calls[id]).filter((c): c is LiveCall => c?.phase === "live");
  const pending = (decisions.data ?? []).filter((d) => d.status === "pending_review");
  const ready = (jobs.data ?? []).filter((j) => j.status === "criteria_ready");
  const needs = [live, pending, ready].filter((xs) => xs.length > 0).length;
  const stats = decisions.data && active.data ? overviewStats(decisions.data, active.data, new Date(now)) : null;
  const date = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(now);

  const newJob = <Button asChild size="lg"><Link href="/jobs/new"><Plus />New job</Link></Button>;
  const header = (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-1.5">
        <p className="text-xs font-semibold tracking-wider text-text-dim uppercase">{date}</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {greeting(new Date(now))} <span className="text-text-dim">{COUNT[needs]}</span>
        </h1>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {showActivity && <Button size="lg" variant="secondary" className="border-line-strong" onClick={showActivity}><PanelRightOpen />Show activity</Button>}
        {newJob}
      </div>
    </header>
  );

  if (jobs.isError) return <div className="space-y-6 p-8">{header}<ErrorState error={jobs.error} onRetry={() => void jobs.refetch()} /></div>;
  if (jobs.data?.length === 0) {
    return (
      <div className="space-y-6 p-8">
        {header}
        <EmptyState icon={Briefcase} title="No jobs yet" action={newJob}>
          Create a job, or load the demo workspace with <code className="num">uv run screening-demo-seed</code> in the voiceAgent repo.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="space-y-7 p-8">
      {header}
      <NeedsYou live={live} pending={pending} ready={ready} now={now} />
      <section className="grid grid-cols-2 gap-4 @3xl:grid-cols-4" aria-label="Today's numbers">
        <StatTile label="Live now" value={stats?.liveNow ?? "—"} live={(stats?.liveNow ?? 0) > 0} sub="calls in progress" />
        <StatTile label="Screened today" value={stats?.screenedToday ?? "—"} sub="calls with a decision" />
        <StatTile label="Suitable today" value={stats?.suitableToday ?? "—"} sub="after any override" />
        <StatTile label="Waiting on you" value={stats?.awaitingReview ?? "—"} warn={(stats?.awaitingReview ?? 0) > 0} sub="decisions to approve" />
      </section>
      {jobs.isPending ? (
        <SkeletonCards count={3} />
      ) : decisions.isError ? (
        <ErrorState error={decisions.error} onRetry={() => void decisions.refetch()} title="Couldn't load decisions" />
      ) : (
        <JobsTable jobs={jobs.data ?? []} candidates={candidates.data} decisions={decisions.data ?? []} live={live} />
      )}
    </div>
  );
}
