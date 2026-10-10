"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { CandidatesTab } from "@/components/candidates/candidates-tab";
import { JobBanner } from "@/components/criteria/job-banner";
import { CriteriaTab } from "@/components/criteria/criteria-tab";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/pill";
import { ErrorState, SkeletonCards } from "@/components/states";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isNotFound } from "@/lib/api/errors";
import { useJob } from "@/lib/api/queries";
import type { Job } from "@/lib/api/types";

type TabId = "criteria" | "candidates" | "campaign" | "decisions";

const TABS: { id: TabId; label: string; render: (job: Job) => ReactNode }[] = [
  { id: "criteria", label: "Criteria", render: (job) => <CriteriaTab job={job} /> },
  { id: "candidates", label: "Candidates", render: (job) => <CandidatesTab job={job} /> },
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
        <TabsList className="mx-8 mt-4">
          {TABS.map((t) => <TabsTrigger key={t.id} value={t.id}>{t.label}</TabsTrigger>)}
        </TabsList>
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
