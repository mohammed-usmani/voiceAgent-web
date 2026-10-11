"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Pill, ResultPill } from "@/components/pill";
import { Waveform } from "@/components/live/waveform";
import { Button } from "@/components/ui/button";
import { useApprovedCriteria } from "@/lib/api/queries";
import type { DecisionSummary, Job } from "@/lib/api/types";
import { finalResult, queueOrder } from "@/lib/decisions";
import { formatRelative } from "@/lib/format";
import type { LiveCall } from "@/lib/live/focus";
import { useLiveCall, useLiveCalls } from "@/lib/live/provider";
import { useElapsed } from "@/lib/use-now";
import { cn } from "@/lib/utils";

function NeedCard({ accent = false, children }: { accent?: boolean; children: ReactNode }) {
  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-2xl border bg-panel p-5",
        accent ? "border-teal/30 bg-[linear-gradient(180deg,rgb(110_231_192/0.07),transparent_60%)]" : "border-line",
      )}
    >
      {children}
    </article>
  );
}

const STATE_WORD = { initializing: "joining", listening: "listening", thinking: "thinking", speaking: "speaking" } as const;

function LiveNow({ call }: { call: LiveCall }) {
  const live = useLiveCall(call.id);
  const { dispatch } = useLiveCalls();
  const elapsed = useElapsed(call.startedAt);
  const total = useApprovedCriteria(call.jobId).data?.requirements.length ?? 0;
  const covered = Math.min(live.asked.length, total);
  return (
    <NeedCard accent>
      <div className="flex items-center justify-between">
        <Pill tone="teal" className="gap-1.5"><span className="size-1.5 animate-pulse rounded-full bg-teal" aria-hidden />Live now</Pill>
        <span className="num text-sm text-text-muted">{elapsed}</span>
      </div>
      <div>
        <h3 className="text-lg font-semibold">{call.candidateName}</h3>
        <p className="text-sm text-text-muted">{call.jobTitle}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-28 shrink-0 overflow-hidden"><Waveform levels={live.levels} state={live.agentState} compact /></div>
        <p className="text-sm text-text-muted">
          Agent is <strong className="font-semibold text-text">{STATE_WORD[live.agentState ?? "initializing"]}</strong>
          {total > 0 && <><br />Questions covered <span className="num text-text">{covered} / {total}</span></>}
        </p>
      </div>
      {total > 0 && (
        <div className="h-1.5 overflow-hidden rounded-full bg-line" role="img" aria-label={`${covered} of ${total} questions covered`}>
          <div className="h-full rounded-full bg-teal transition-[width]" style={{ width: `${(covered / total) * 100}%` }} />
        </div>
      )}
      <Button size="lg" className="mt-auto" onClick={() => dispatch({ type: "focus", callId: call.id })}>
        Watch live<ArrowRight />
      </Button>
    </NeedCard>
  );
}

function ToReview({ decisions, now }: { decisions: DecisionSummary[]; now: number }) {
  const queue = queueOrder(decisions);
  const oldest = decisions.reduce((a, d) => (d.created_at < a ? d.created_at : a), decisions[0].created_at);
  return (
    <NeedCard>
      <div className="flex items-center justify-between gap-3">
        <Pill tone="amber">{decisions.length === 1 ? "1 decision to review" : `${decisions.length} decisions to review`}</Pill>
        <span className="text-sm text-text-dim">oldest {formatRelative(oldest, now)}</span>
      </div>
      <ul className="-mx-2 space-y-0.5">
        {queue.slice(0, 3).map((d) => (
          <li key={d.id}>
            <Link href={`/decisions/${d.id}`} className="flex min-h-10 items-center gap-3 rounded-lg px-2 hover:bg-panel-raised">
              <span className="min-w-0 flex-1 truncate">{d.candidate_name}</span>
              <ResultPill result={finalResult(d)} />
            </Link>
          </li>
        ))}
      </ul>
      <Button asChild size="lg" variant="secondary" className="mt-auto border-line-strong">
        <Link href={`/decisions/${queue[0].id}`}>Start reviewing</Link>
      </Button>
    </NeedCard>
  );
}

function CriteriaReady({ job }: { job: Job }) {
  const href = `/jobs/${job.id}?tab=criteria`;
  return (
    <NeedCard>
      <div className="flex items-center justify-between">
        <Pill tone="blue">Criteria ready</Pill>
      </div>
      <div>
        <h3 className="text-lg font-semibold">{job.title}</h3>
        <p className="text-sm text-text-muted">The agent drafted what to screen for, quoting the job description. Check it before any calls go out.</p>
      </div>
      <Button asChild size="lg" variant="secondary" className="mt-auto border-line-strong">
        <Link href={href}>Review &amp; approve</Link>
      </Button>
    </NeedCard>
  );
}

/** Live calls, decisions waiting for a person and criteria waiting for approval: one card each. */
export function NeedsYou({ live, pending, ready, now }: { live: LiveCall[]; pending: DecisionSummary[]; ready: Job[]; now: number }) {
  const empty = live.length === 0 && pending.length === 0 && ready.length === 0;
  return (
    <section aria-labelledby="needs-you" className="space-y-3">
      <h2 id="needs-you" className="text-xs font-semibold tracking-wider text-text-dim uppercase">Needs you</h2>
      {empty ? (
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-panel px-5 py-4 text-sm text-text-muted">
          <CheckCircle2 className="size-5 text-teal" aria-hidden />
          All clear: no live calls, nothing to review and no criteria waiting.
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(17rem,1fr))] gap-4">
          {live.slice(0, 1).map((c) => <LiveNow key={c.id} call={c} />)}
          {pending.length > 0 && <ToReview decisions={pending} now={now} />}
          {ready.slice(0, 1).map((j) => <CriteriaReady key={j.id} job={j} />)}
        </div>
      )}
    </section>
  );
}
