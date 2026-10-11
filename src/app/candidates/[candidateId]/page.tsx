"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CandidateActions } from "@/components/candidates/candidate-actions";
import { PageHeader } from "@/components/page-header";
import { Pill, ResultPill, StatusPill } from "@/components/pill";
import { ErrorState, SkeletonCards } from "@/components/states";
import { Transcript } from "@/components/transcript";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isNotFound } from "@/lib/api/errors";
import {
  useCalls,
  useCandidate,
  useDecision,
  useDecisions,
  useJob,
} from "@/lib/api/queries";
import type { Call } from "@/lib/api/types";
import { candidateTimeline, hasActiveCall } from "@/lib/candidates";
import { finalResult, latestByCandidate } from "@/lib/decisions";
import {
  formatDateTime,
  formatDuration,
  formatScore,
  humanize,
} from "@/lib/format";
import { cn } from "@/lib/utils";

const DOT = {
  teal: "bg-teal",
  amber: "bg-amber",
  rose: "bg-rose",
  muted: "bg-text-dim",
} as const;

function CallCard({ call, open }: { call: Call; open: boolean }) {
  const duration =
    call.started_at && call.ended_at
      ? formatDuration(Date.parse(call.ended_at) - Date.parse(call.started_at))
      : null;
  return (
    <details
      className="group rounded-xl border border-line bg-panel"
      open={open}
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3">
        <span className="num text-sm text-text-muted">Call {call.attempt}</span>
        <StatusPill status={call.status} />
        {/* "Completed · Completed" read twice: the end reason only when it adds something */}
        {call.end_reason && call.end_reason !== call.status && (
          <span className="text-sm">{humanize(call.end_reason)}</span>
        )}
        <span className="num ml-auto text-xs text-text-dim">
          {formatDateTime(call.created_at)}
          {duration && ` · ${duration}`}
        </span>
      </summary>
      <div className="border-t border-line px-4 py-4">
        {call.error && <p className="mb-3 text-sm text-rose">{call.error}</p>}
        {call.callback_at && (
          <p className="mb-3 text-sm text-amber">
            Asked to be called back at {formatDateTime(call.callback_at)}
          </p>
        )}
        <Transcript turns={call.transcript} />
      </div>
    </details>
  );
}

export default function CandidatePage() {
  const { candidateId } = useParams<{ candidateId: string }>();
  const router = useRouter();
  const candidate = useCandidate(candidateId);
  const c = candidate.data;
  const calls = useCalls(candidateId);
  const job = useJob(c?.job_id);
  const decisions = useDecisions({ jobId: c?.job_id });
  const latest = c
    ? latestByCandidate(decisions.data ?? []).get(c.id)
    : undefined;
  const decision = useDecision(latest?.id);

  if (candidate.isPending)
    return (
      <div className="p-8">
        <SkeletonCards count={3} />
      </div>
    );
  if (candidate.isError || !c) {
    return (
      <div className="p-8">
        <ErrorState
          error={candidate.error}
          title={
            isNotFound(candidate.error)
              ? "Candidate not found"
              : "Couldn't load this candidate"
          }
          onRetry={() => void candidate.refetch()}
        />
      </div>
    );
  }

  const sortedCalls = [...(calls.data ?? [])].sort(
    (a, b) => b.attempt - a.attempt,
  );
  const message = decision.data?.message;

  return (
    <>
      <PageHeader
        eyebrow={
          job.data ? (
            <Link
              href={`/jobs/${job.data.id}?tab=candidates`}
              className="hover:text-teal"
            >
              {job.data.title}
            </Link>
          ) : (
            "…"
          )
        }
        title={c.name}
        subtitle={
          <span className="num">
            {[c.email, c.phone, c.sip_address].filter(Boolean).join(" · ")}
          </span>
        }
        actions={
          <>
            <StatusPill status={c.status} />
            {c.excluded_at && <Pill tone="amber">Calling stopped</Pill>}
            <CandidateActions
              candidate={c}
              activeCall={hasActiveCall(calls.data)}
              onDeleted={() => router.push(`/jobs/${c.job_id}?tab=candidates`)}
            />
          </>
        }
      />
      <div className="grid gap-6 p-8 @wide:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <section aria-labelledby="calls-heading" className="space-y-3">
            <h2
              id="calls-heading"
              className="text-sm font-medium text-text-muted"
            >
              Calls
            </h2>
            {calls.isPending && <SkeletonCards count={1} />}
            {calls.isError && (
              <ErrorState
                error={calls.error}
                onRetry={() => void calls.refetch()}
              />
            )}
            {calls.data?.length === 0 && (
              <p className="text-sm text-text-dim">Not called yet.</p>
            )}
            {sortedCalls.map((k, i) => (
              <CallCard key={k.id} call={k} open={i === 0} />
            ))}
          </section>
          <Card>
            <CardHeader>
              <CardTitle>Résumé</CardTitle>
            </CardHeader>
            <CardContent>
              {c.resume_text ? (
                <p className="text-sm whitespace-pre-wrap text-text-muted">
                  {c.resume_text}
                </p>
              ) : (
                <p className="text-sm text-text-dim">No résumé was added.</p>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Decision</CardTitle>
            </CardHeader>
            <CardContent>
              {latest ? (
                <div className="flex items-center gap-3">
                  <ResultPill result={finalResult(latest)} />
                  <span className="num text-lg">
                    {formatScore(latest.score)}
                  </span>
                  <StatusPill status={latest.status} />
                  <Button
                    asChild
                    size="sm"
                    variant="secondary"
                    className="ml-auto"
                  >
                    <Link href={`/decisions/${latest.id}`}>Review</Link>
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-text-dim">
                  No decision yet: one is made after a screening call.
                </p>
              )}
            </CardContent>
          </Card>
          {message && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {message.kind === "invite" ? "Invitation" : "Rejection"}{" "}
                  <StatusPill status={message.status} />
                </CardTitle>
                <CardDescription>
                  {message.sent_at
                    ? `Sent ${formatDateTime(message.sent_at)}`
                    : "Not sent yet"}{" "}
                  · to {message.to}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{message.subject}</p>
                <p className="mt-2 text-sm whitespace-pre-wrap text-text-muted">
                  {message.body}
                </p>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2.5">
                {candidateTimeline(c, calls.data ?? [], decision.data).map(
                  (item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <span
                        className={cn(
                          "mt-1.5 size-1.5 shrink-0 rounded-full",
                          DOT[item.tone],
                        )}
                        aria-hidden
                      />
                      <span className="flex-1">{item.text}</span>
                      <time
                        className="num text-xs text-text-dim"
                        dateTime={item.at}
                      >
                        {formatDateTime(item.at)}
                      </time>
                    </li>
                  ),
                )}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
