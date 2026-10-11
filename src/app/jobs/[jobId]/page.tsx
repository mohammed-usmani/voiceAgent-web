"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { CandidatesTab } from "@/components/candidates/candidates-tab";
import { CampaignTab } from "@/components/campaign/campaign-tab";
import { JobBanner } from "@/components/criteria/job-banner";
import { CriteriaTab } from "@/components/criteria/criteria-tab";
import { DecisionQueue } from "@/components/decisions/decision-queue";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/pill";
import { ErrorState, SkeletonCards } from "@/components/states";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { JobSteps, type StepId } from "@/components/job-steps";
import { isNotFound } from "@/lib/api/errors";
import { useJob } from "@/lib/api/queries";
import type { Job } from "@/lib/api/types";

type TabId = StepId;

const TABS: { id: TabId; render: (job: Job) => ReactNode }[] = [
  { id: "criteria", render: (job) => <CriteriaTab job={job} /> },
  { id: "candidates", render: (job) => <CandidatesTab job={job} /> },
  { id: "campaign", render: (job) => <CampaignTab job={job} /> },
  { id: "decisions", render: (job) => <div className="p-8"><DecisionQueue jobId={job.id} /></div> },
];

function JobWorkspace() {
  const { jobId } = useParams<{ jobId: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const job = useJob(jobId);

  if (job.isPending) {
    return (
      <div className="space-y-6 p-8">
        <Skeleton className="h-8 w-80" />
        <SkeletonCards count={3} />
      </div>
    );
  }
  if (job.isError) {
    return (
      <div className="p-8">
        <ErrorState error={job.error} title={isNotFound(job.error) ? "Job not found" : "Couldn't load this job"} onRetry={() => void job.refetch()} />
      </div>
    );
  }

  const j = job.data;
  const fallback: TabId = j.status === "active" && TABS.some((t) => t.id === "candidates") ? "candidates" : "criteria";
  const tab = TABS.find((t) => t.id === params.get("tab"))?.id ?? fallback;

  return (
    <>
      <PageHeader
        eyebrow={j.company_name}
        title={j.title}
        subtitle={<span className="num">{j.timezone} · calls {j.calling_hours.start}–{j.calling_hours.end} · agent {j.agent_name}</span>}
        actions={<StatusPill status={j.status} />}
      />
      <JobBanner job={j} />
      <Tabs value={tab} onValueChange={(t) => router.replace(`/jobs/${j.id}?tab=${t}`, { scroll: false })}>
        <JobSteps job={j} />
        {TABS.map((t) => <TabsContent key={t.id} value={t.id}>{t.render(j)}</TabsContent>)}
      </Tabs>
    </>
  );
}

export default function JobPage() {
  return (
    <Suspense>
      <JobWorkspace />
    </Suspense>
  );
}
