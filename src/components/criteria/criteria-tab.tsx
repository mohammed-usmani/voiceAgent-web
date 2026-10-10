"use client";

import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRegenerateCriteria } from "@/lib/api/mutations";
import type { Job } from "@/lib/api/types";
import { criteriaSteps, sourceText } from "@/lib/criteria";
import { useEvents } from "@/lib/events/provider";
import { AgentSteps } from "./agent-steps";
import { CriteriaPanel } from "./criteria-panel";
import { JobDescription } from "./job-description";

function Generating({ job }: { job: Job }) {
  const { recent } = useEvents();
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-6 p-8">
      <AgentSteps steps={criteriaSteps(recent, job.id)} working />
      <JobDescription text={sourceText(job)} spans={[]} active={null} />
    </div>
  );
}

function Failed({ job }: { job: Job }) {
  const regenerate = useRegenerateCriteria(job.id);
  const { recent } = useEvents();
  const failure = recent.find((e) => e.entity === "job" && e.entity_id === job.id && e.type === "criteria_failed");
  const reason = typeof failure?.data.error === "string" ? failure.data.error : null;
  return (
    <div className="p-8">
      <div role="alert" className="rounded-xl border border-rose/30 bg-rose-soft p-6">
        <p className="font-medium">The criteria agent couldn&apos;t finish</p>
        <p className="mt-1 text-sm text-text-muted">{reason ?? "Try again; if it keeps failing, check the worker's log."}</p>
        <Button className="mt-4" variant="secondary" onClick={() => regenerate.mutate()} disabled={regenerate.isPending}><RotateCw />Regenerate</Button>
      </div>
    </div>
  );
}

export function CriteriaTab({ job }: { job: Job }) {
  if (job.status === "generating") return <Generating job={job} />;
  if (job.status === "criteria_failed") return <Failed job={job} />;
  return <CriteriaPanel job={job} />;
}
