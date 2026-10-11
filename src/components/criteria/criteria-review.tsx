"use client";

import { Pencil, Trash2 } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Pill } from "@/components/pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CriteriaVersion, Job, Requirement } from "@/lib/api/types";
import { criteriaSteps, findQuote, parseWarnings, sourceText } from "@/lib/criteria";
import { useEvents } from "@/lib/events/provider";
import { humanize } from "@/lib/format";
import { AgentSteps } from "./agent-steps";
import { JobDescription } from "./job-description";
import { RequirementCard } from "./requirement-card";

interface Props {
  job: Job;
  criteria: CriteriaVersion;
  toolbar?: ReactNode;
  onEdit?: (r: Requirement) => void;
  onDelete?: (r: Requirement) => void;
}

export function CriteriaReview({ job, criteria, toolbar, onEdit, onDelete }: Props) {
  const [active, setActive] = useState<string | null>(null);
  const { recent } = useEvents();
  const steps = criteriaSteps(recent, job.id);
  const text = sourceText(job);
  const spans = useMemo(
    () => criteria.requirements.flatMap((r) => {
      const range = findQuote(text, r.source);
      return range ? [{ id: r.id, range }] : [];
    }),
    [criteria.requirements, text],
  );
  const { removed, other } = parseWarnings(criteria.warnings);
  const facts = criteria.job_facts;

  return (
    <div className="grid gap-6 p-8 @wide:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <div className="space-y-6">
        {steps.length > 0 && <AgentSteps steps={steps} working={false} />}
        <div className="@wide:sticky @wide:top-4"><JobDescription text={text} spans={spans} active={active} /></div>
      </div>
      <div className="space-y-4">
        {toolbar}
        {criteria.errors.length > 0 && (
          <ul role="alert" className="space-y-1 rounded-lg border border-rose/30 bg-rose-soft p-3 text-sm text-rose">
            {criteria.errors.map((e) => <li key={e}>{e}</li>)}
          </ul>
        )}
        {criteria.requirements.map((r) => (
          <RequirementCard
            key={r.id}
            r={r}
            active={active === r.id}
            onHover={setActive}
            actions={onEdit && onDelete && (
              <>
                <Button size="icon" variant="ghost" aria-label={`Edit ${r.label}`} onClick={() => onEdit(r)}><Pencil /></Button>
                <ConfirmDialog
                  trigger={<Button size="icon" variant="ghost" aria-label={`Remove ${r.label}`}><Trash2 /></Button>}
                  title={`Remove "${r.label}"?`}
                  description="The agent won't ask it. This saves a draft you approve again."
                  confirmLabel="Remove"
                  destructive
                  onConfirm={() => onDelete(r)}
                />
              </>
            )}
          />
        ))}
        {criteria.requirements.length === 0 && <p className="text-sm text-text-muted">No requirements: regenerate, or approval is blocked.</p>}
        {removed.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Dropped by the agent</CardTitle>
              <CardDescription>Lines it would not screen on</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {removed.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-baseline gap-2">
                    <span className="text-text-dim line-through decoration-rose/70">{humanize(r.id)}</span>
                    <Pill tone="rose">{r.kind}</Pill>
                    <span className="text-text-muted">{r.detail}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        {other.length > 0 && (
          <ul className="space-y-1 rounded-lg border border-amber/30 bg-amber-soft p-3 text-sm text-amber">
            {other.map((w) => <li key={w}>{w}</li>)}
          </ul>
        )}
        <Card>
          <CardHeader>
            <CardTitle>What the agent tells candidates</CardTitle>
            <CardDescription>It answers questions only from these facts</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[8rem_minmax(0,1fr)] gap-y-1.5 text-sm">
              <dt className="text-text-dim">Summary</dt><dd>{facts.summary}</dd>
              {facts.location && <><dt className="text-text-dim">Location</dt><dd>{facts.location}</dd></>}
              {facts.work_mode && <><dt className="text-text-dim">Work mode</dt><dd>{facts.work_mode}</dd></>}
              {facts.salary_band && <><dt className="text-text-dim">Salary</dt><dd>{facts.salary_band}</dd></>}
              {facts.interview_process && <><dt className="text-text-dim">Interviews</dt><dd>{facts.interview_process}</dd></>}
              {facts.other.map((o) => <dd key={o} className="col-start-2">{o}</dd>)}
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
