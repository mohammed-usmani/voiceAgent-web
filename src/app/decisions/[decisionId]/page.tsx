"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ApproveButton } from "@/components/decisions/approve-button";
import { MessageEditor } from "@/components/decisions/message-editor";
import { OverrideDialog } from "@/components/decisions/override-dialog";
import { RequirementRows } from "@/components/decisions/requirement-rows";
import { ReviewerCard } from "@/components/decisions/reviewer-card";
import { ScoreMeter } from "@/components/decisions/score-meter";
import { PageHeader } from "@/components/page-header";
import { ResultPill, StatusPill } from "@/components/pill";
import { ErrorState, SkeletonCards } from "@/components/states";
import { isNotFound } from "@/lib/api/errors";
import { useApprovedCriteria, useDecision, useJob } from "@/lib/api/queries";
import { decisionRows, finalResult, RESULT_LABEL } from "@/lib/decisions";
import { formatDateTime } from "@/lib/format";

export default function DecisionPage() {
  const { decisionId } = useParams<{ decisionId: string }>();
  const decision = useDecision(decisionId);
  const d = decision.data;
  const job = useJob(d?.job_id);
  const criteria = useApprovedCriteria(d?.job_id);

  if (decision.isPending) return <div className="p-8"><SkeletonCards count={3} /></div>;
  if (decision.isError || !d) {
    return (
      <div className="p-8">
        <ErrorState error={decision.error} title={isNotFound(decision.error) ? "Decision not found" : "Couldn't load this decision"} onRetry={() => void decision.refetch()} />
      </div>
    );
  }

  const requirements = criteria.data?.requirements ?? [];
  const criteriaChanged = criteria.data && criteria.data.id !== d.criteria_version_id;

  return (
    <>
      <PageHeader
        eyebrow={job.data ? <Link href={`/jobs/${job.data.id}?tab=decisions`} className="hover:text-teal">{job.data.title}</Link> : "…"}
        title={<Link href={`/candidates/${d.candidate_id}`} className="hover:text-teal">{d.candidate_name}</Link>}
        subtitle={`Decided ${formatDateTime(d.created_at)}`}
        actions={<><OverrideDialog decision={d} requirements={requirements} /><ApproveButton decision={d} /></>}
      />
      <div className="space-y-6 p-8">
        <section className="flex items-center gap-10 rounded-xl border border-line bg-panel px-6 py-5" aria-label="Verdict">
          <div>
            <p className="text-xs tracking-wider text-text-dim uppercase">Result</p>
            <ResultPill result={finalResult(d)} className="mt-1.5 px-2.5 py-1 text-base" />
            {d.final_result && d.final_result !== d.result && <p className="mt-1.5 text-xs text-text-dim">The agent said {RESULT_LABEL[d.result].toLowerCase()}</p>}
          </div>
          <ScoreMeter score={d.score} pass={criteria.data?.pass_threshold ?? null} />
          <div>
            <p className="text-xs tracking-wider text-text-dim uppercase">Status</p>
            <StatusPill status={d.status} className="mt-1.5" />
          </div>
          <p className="ml-auto max-w-md text-sm text-text-muted">{d.summary}</p>
        </section>
        <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-6">
          <div className="space-y-3">
            {criteriaChanged && <p className="text-xs text-amber">The criteria changed after this call; rules shown are the current ones.</p>}
            {criteria.isError ? <ErrorState error={criteria.error} onRetry={() => void criteria.refetch()} title="Couldn't load the criteria" /> : <RequirementRows rows={decisionRows(d, requirements)} />}
            {d.reviewer_note && <p className="rounded-lg border border-line bg-panel p-4 text-sm"><span className="text-text-dim">Your note: </span>{d.reviewer_note}</p>}
          </div>
          <div className="space-y-6">
            <ReviewerCard review={d.agent_review} />
            <MessageEditor decision={d} />
          </div>
        </div>
      </div>
    </>
  );
}
