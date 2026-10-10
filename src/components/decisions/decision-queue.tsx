"use client";

import { Inbox } from "lucide-react";
import Link from "next/link";
import { ResultPill, StatusPill } from "@/components/pill";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/states";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDecisions, useJobs } from "@/lib/api/queries";
import type { DecisionStatus } from "@/lib/api/types";
import { finalResult, queueOrder } from "@/lib/decisions";
import { formatRelative, formatScore } from "@/lib/format";
import { useNow } from "@/lib/use-now";

export function DecisionQueue({ jobId, status }: { jobId?: string; status?: DecisionStatus }) {
  const decisions = useDecisions({ jobId, status });
  const jobs = useJobs();
  const now = useNow(60_000);
  const titles = new Map((jobs.data ?? []).map((j) => [j.id, j.title]));

  if (decisions.isPending) return <SkeletonRows rows={5} />;
  if (decisions.isError) return <ErrorState error={decisions.error} onRetry={() => void decisions.refetch()} />;
  if (decisions.data.length === 0) {
    return (
      <EmptyState icon={Inbox} title={status === "pending_review" ? "Nothing to review" : "No decisions yet"}>
        Each screening call ends in a decision; they land here for review.
      </EmptyState>
    );
  }
  return (
    <div className="rounded-xl border border-line bg-panel">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Candidate</TableHead>
            {!jobId && <TableHead>Job</TableHead>}
            <TableHead>Result</TableHead>
            <TableHead className="text-right">Score</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Made</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {queueOrder(decisions.data).map((d) => (
            <TableRow key={d.id} className="relative">
              <TableCell>
                <Link href={`/decisions/${d.id}`} className="font-medium after:absolute after:inset-0 hover:text-teal">{d.candidate_name}</Link>
              </TableCell>
              {!jobId && <TableCell className="text-sm text-text-muted">{titles.get(d.job_id) ?? "—"}</TableCell>}
              <TableCell><ResultPill result={finalResult(d)} /></TableCell>
              <TableCell className="num text-right">{formatScore(d.score)}</TableCell>
              <TableCell><StatusPill status={d.status} /></TableCell>
              <TableCell className="num text-right text-xs text-text-dim">{formatRelative(d.created_at, now)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
