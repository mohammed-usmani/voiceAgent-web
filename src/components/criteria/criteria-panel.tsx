"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { StatusPill } from "@/components/pill";
import { ErrorState, SkeletonCards } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useApproveCriteria, useSaveCriteria } from "@/lib/api/mutations";
import { useCriteria } from "@/lib/api/queries";
import type { CriteriaVersion, Job, Requirement } from "@/lib/api/types";
import { formatDateTime, formatScore } from "@/lib/format";
import { CriteriaReview } from "./criteria-review";
import { RequirementSheet } from "./requirement-sheet";

function PassMark({
  value,
  disabled,
  onCommit,
}: {
  value: number;
  disabled: boolean;
  onCommit: (v: number) => void;
}) {
  const [draft, setDraft] = useState<number | null>(null);
  const shown = draft ?? value;
  return (
    <div className="flex w-56 items-center gap-3">
      <span className="text-xs whitespace-nowrap text-text-dim">Pass mark</span>
      <Slider
        min={0}
        max={1}
        step={0.05}
        value={[shown]}
        disabled={disabled}
        aria-label="Pass mark"
        onValueChange={([v]) => setDraft(v)}
        onValueCommit={([v]) => {
          setDraft(null);
          if (v !== value) onCommit(v);
        }}
      />
      <span className="num w-10 text-right text-sm">{formatScore(shown)}</span>
    </div>
  );
}

function Toolbar({
  cv,
  saving,
  onPassMark,
  jobId,
}: {
  cv: CriteriaVersion;
  saving: boolean;
  onPassMark: (v: number) => void;
  jobId: string;
}) {
  const approve = useApproveCriteria(jobId);
  const isDraft = cv.status === "draft";
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-xl border border-line bg-panel px-4 py-3">
      <div className="flex min-w-0 items-center gap-3 text-sm">
        <StatusPill status={cv.status} />
        <span className="num text-text-muted">v{cv.version}</span>
        <span className="truncate text-xs text-text-dim">
          {isDraft
            ? cv.model
            : `approved ${cv.approved_at ? formatDateTime(cv.approved_at) : ""} · edits start a new draft`}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <PassMark
          value={cv.pass_threshold}
          disabled={saving}
          onCommit={onPassMark}
        />
        {isDraft && (
          <Button
            onClick={() => approve.mutate()}
            disabled={approve.isPending || cv.errors.length > 0}
            title={cv.errors.length ? "Fix the errors first" : undefined}
          >
            <Check />
            Approve criteria
          </Button>
        )}
      </div>
    </div>
  );
}

export function CriteriaPanel({ job }: { job: Job }) {
  const criteria = useCriteria(job.id);
  const save = useSaveCriteria(job.id);
  const [editing, setEditing] = useState<Requirement | null>(null);

  if (criteria.isPending)
    return (
      <div className="p-8">
        <SkeletonCards count={4} />
      </div>
    );
  if (criteria.isError)
    return (
      <div className="p-8">
        <ErrorState
          error={criteria.error}
          onRetry={() => void criteria.refetch()}
        />
      </div>
    );

  const cv = criteria.data;
  const saveWith = (
    requirements: Requirement[],
    passThreshold = cv.pass_threshold,
  ) =>
    save.mutate({
      requirements,
      job_facts: cv.job_facts,
      pass_threshold: passThreshold,
    });

  return (
    <>
      <CriteriaReview
        job={job}
        criteria={cv}
        toolbar={
          <Toolbar
            cv={cv}
            jobId={job.id}
            saving={save.isPending}
            onPassMark={(v) => saveWith(cv.requirements, v)}
          />
        }
        onEdit={setEditing}
        onDelete={(r) => saveWith(cv.requirements.filter((x) => x.id !== r.id))}
      />
      <RequirementSheet
        requirement={editing}
        onClose={() => setEditing(null)}
        onSave={(r) => {
          saveWith(cv.requirements.map((x) => (x.id === r.id ? r : x)));
          setEditing(null);
        }}
      />
    </>
  );
}
