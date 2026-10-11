"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCampaign } from "@/lib/api/queries";
import type { Candidate, DecisionSummary, Job } from "@/lib/api/types";
import { finalResult, latestByCandidate } from "@/lib/decisions";
import type { LiveCall } from "@/lib/live/focus";
import { useLiveCalls } from "@/lib/live/provider";
import { nextStep, screenedCount } from "@/lib/overview";

function JobRow({ job, candidates, decisions, live }: { job: Job; candidates: Candidate[]; decisions: DecisionSummary[]; live: LiveCall[] }) {
  const campaign = useCampaign(job.id);
  const { dispatch } = useLiveCalls();
  const screened = screenedCount(candidates);
  const suitable = [...latestByCandidate(decisions).values()].filter((d) => finalResult(d) === "suitable").length;
  const step = nextStep(job, {
    live: live.length,
    pendingReview: decisions.filter((d) => d.status === "pending_review").length,
    candidates: candidates.length,
    campaign: campaign.data?.status ?? null,
  });
  const pct = candidates.length ? (screened / candidates.length) * 100 : 0;

  return (
    <tr className="border-t border-line/70">
      <td className="px-5 py-3.5">
        <Link href={`/jobs/${job.id}`} className="font-semibold hover:text-teal">{job.title}</Link>
        <p className="text-sm text-text-dim">{job.company_name}</p>
      </td>
      <td className="w-[34%] px-3 py-3.5">
        <div className="flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line" role="img" aria-label={`${screened} of ${candidates.length} screened`}>
            <div className="h-full rounded-full bg-teal" style={{ width: `${pct}%` }} />
          </div>
          <span className="num w-12 text-right text-sm text-text-muted">{screened}/{candidates.length}</span>
        </div>
      </td>
      <td className="num px-3 py-3.5">{suitable}</td>
      <td className="px-5 py-3.5 text-right">
        {step.kind === "live" && (
          <Button size="sm" variant="secondary" className="border-teal/30" onClick={() => dispatch({ type: "focus", callId: live[0].id })}>
            <span className="size-1.5 animate-pulse rounded-full bg-teal" aria-hidden />{step.label}
          </Button>
        )}
        {step.kind === "link" && (
          <Button asChild size="sm" variant={step.urgent ? "secondary" : "ghost"} className={step.urgent ? "border-line-strong" : "text-text-muted"}>
            <Link href={step.href}>{step.label}</Link>
          </Button>
        )}
        {step.kind === "none" && <span className="text-sm text-text-dim">{step.label}</span>}
      </td>
    </tr>
  );
}

/** Every job with how far along it is and the one thing to do next. */
export function JobsTable({ jobs, candidates, decisions, live }: { jobs: Job[]; candidates: Candidate[]; decisions: DecisionSummary[]; live: LiveCall[] }) {
  return (
    <section aria-labelledby="jobs-heading" className="overflow-hidden rounded-2xl border border-line bg-panel">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 id="jobs-heading" className="font-semibold">Jobs</h2>
        <Link href="/jobs/new" className="text-sm font-medium text-teal hover:underline">New job</Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs tracking-wider text-text-dim uppercase">
              <th scope="col" className="px-5 py-3 font-semibold">Job</th>
              <th scope="col" className="px-3 py-3 font-semibold">Screened</th>
              <th scope="col" className="px-3 py-3 font-semibold">Suitable</th>
              <th scope="col" className="px-5 py-3 text-right font-semibold">Next step</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <JobRow
                key={j.id}
                job={j}
                candidates={candidates.filter((c) => c.job_id === j.id)}
                decisions={decisions.filter((d) => d.job_id === j.id)}
                live={live.filter((c) => c.jobId === j.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
