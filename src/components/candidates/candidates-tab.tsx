"use client";

import { Users } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Pill, ResultPill, StatusPill } from "@/components/pill";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/states";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCandidates, useCandidatesCalls, useDecisions } from "@/lib/api/queries";
import type { Job } from "@/lib/api/types";
import { hasActiveCall, lastCall } from "@/lib/candidates";
import { finalResult, latestByCandidate } from "@/lib/decisions";
import { formatRelative, formatScore, humanize } from "@/lib/format";
import { useNow } from "@/lib/use-now";
import { AddCandidateDialog } from "./add-candidate-dialog";
import { CandidateActions } from "./candidate-actions";
import { ImportCsvDialog } from "./import-csv-dialog";

export function CandidatesTab({ job }: { job: Job }) {
  const candidates = useCandidates(job.id);
  const decisions = useDecisions({ jobId: job.id });
  const ids = useMemo(() => candidates.data?.map((c) => c.id) ?? [], [candidates.data]);
  const calls = useCandidatesCalls(ids);
  const now = useNow(30_000);
  const toolbar = <div className="flex gap-2"><ImportCsvDialog jobId={job.id} /><AddCandidateDialog jobId={job.id} /></div>;

  if (candidates.isPending) return <div className="p-8"><SkeletonRows rows={6} /></div>;
  if (candidates.isError) return <div className="p-8"><ErrorState error={candidates.error} onRetry={() => void candidates.refetch()} /></div>;
  if (candidates.data.length === 0) {
    return (
      <div className="p-8">
        <EmptyState icon={Users} title="No candidates yet" action={toolbar}>Add someone by hand, or import a CSV.</EmptyState>
      </div>
    );
  }

  const latest = latestByCandidate(decisions.data ?? []);
  return (
    <div className="space-y-4 p-8">
      <div className="flex items-center justify-between">
        <p className="num text-sm text-text-muted">{candidates.data.length} candidates</p>
        {toolbar}
      </div>
      <div className="rounded-xl border border-line bg-panel">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last call</TableHead>
              <TableHead>Decision</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.data.map((c) => {
              const theirCalls = calls.byCandidate[c.id];
              const last = lastCall(theirCalls);
              const d = latest.get(c.id);
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/candidates/${c.id}`} className="font-medium hover:text-teal">{c.name}</Link>
                    <p className="text-xs text-text-dim">{c.email}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      <StatusPill status={c.status} />
                      {c.excluded_at && <Pill tone="amber">Calling stopped</Pill>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-text-muted">
                    {last ? (
                      <span>
                        {humanize(last.end_reason ?? last.status)} · <span className="num">{formatRelative(last.ended_at ?? last.created_at, now)}</span>
                      </span>
                    ) : (
                      <span className="text-text-dim">{calls.isPending ? "…" : "Not called yet"}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {d ? (
                      <Link href={`/decisions/${d.id}`} className="flex items-center gap-2 hover:opacity-80">
                        <ResultPill result={finalResult(d)} />
                        <span className="num text-sm text-text-muted">{formatScore(d.score)}</span>
                      </Link>
                    ) : (
                      <span className="text-text-dim">—</span>
                    )}
                  </TableCell>
                  <TableCell><CandidateActions candidate={c} activeCall={hasActiveCall(theirCalls)} /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
