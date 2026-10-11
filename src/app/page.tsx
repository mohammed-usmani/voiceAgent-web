"use client";

import { Briefcase, Plus } from "lucide-react";
import Link from "next/link";
import { JobsPanel } from "@/components/overview/jobs-panel";
import { LatestDecisions } from "@/components/overview/latest-decisions";
import { OutcomeChart } from "@/components/overview/outcome-chart";
import { StatTile } from "@/components/overview/stat-tiles";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, SkeletonCards } from "@/components/states";
import { Button } from "@/components/ui/button";
import { useActiveCalls, useAllCandidates, useDecisions, useEvalRuns, useJobs } from "@/lib/api/queries";
import { formatUsd } from "@/lib/format";
import { outcomeBuckets, overviewStats } from "@/lib/overview";
import { useNow } from "@/lib/use-now";

export default function OverviewPage() {
  const jobs = useJobs();
  const decisions = useDecisions();
  const active = useActiveCalls();
  const candidates = useAllCandidates(jobs.data);
  const runs = useEvalRuns();
  const now = useNow(60_000);

  const newJob = <Button asChild><Link href="/jobs/new"><Plus />New job</Link></Button>;
  const header = <PageHeader title="Overview" subtitle="Today's screening at a glance" actions={newJob} />;

  if (jobs.isError) return <>{header}<div className="p-8"><ErrorState error={jobs.error} onRetry={() => void jobs.refetch()} /></div></>;
  if (jobs.data?.length === 0) {
    return (
      <>
        {header}
        <div className="p-8">
          <EmptyState icon={Briefcase} title="No jobs yet" action={newJob}>
            Create a job, or load the demo workspace with <code className="num">uv run screening-demo-seed</code> in the voiceAgent repo.
          </EmptyState>
        </div>
      </>
    );
  }

  const stats = decisions.data && active.data ? overviewStats(decisions.data, active.data, new Date(now)) : null;
  const latestRun = runs.data?.filter((r) => !r.offline).sort((a, b) => b.name.localeCompare(a.name))[0];
  const perCall = latestRun?.headline["cost.per_call_usd"];

  return (
    <>
      {header}
      <div className="space-y-6 p-8">
        <section className="grid grid-cols-3 gap-4 @wide:grid-cols-5" aria-label="Today">
          <StatTile label="Live now" value={stats?.liveNow ?? "—"} live={(stats?.liveNow ?? 0) > 0} sub="calls in progress" />
          <StatTile label="Screened today" value={stats?.screenedToday ?? "—"} sub="decisions made" />
          <StatTile label="Suitable today" value={stats?.suitableToday ?? "—"} sub="after any override" />
          <StatTile label="Awaiting review" value={stats?.awaitingReview ?? "—"} warn={(stats?.awaitingReview ?? 0) > 0} sub="to approve" />
          <StatTile
            label="Cost per call"
            value={formatUsd(typeof perCall === "number" ? perCall : null)}
            sub={latestRun ? "latest evaluation run" : "no evaluation run yet"}
          />
        </section>
        {jobs.isPending ? (
          <SkeletonCards count={3} />
        ) : (
          <div className="grid gap-6 @wide:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <JobsPanel jobs={jobs.data ?? []} candidates={candidates.data} />
            <OutcomeChart buckets={outcomeBuckets(decisions.data ?? [], candidates.data)} />
          </div>
        )}
        {decisions.isError ? (
          <ErrorState error={decisions.error} onRetry={() => void decisions.refetch()} title="Couldn't load decisions" />
        ) : (
          <LatestDecisions decisions={decisions.data ?? []} now={now} />
        )}
      </div>
    </>
  );
}
