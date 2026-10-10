"use client";

import Link from "next/link";
import { Pill, StatusPill } from "@/components/pill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCampaign } from "@/lib/api/queries";
import type { Candidate, Job } from "@/lib/api/types";

function CampaignState({ jobId }: { jobId: string }) {
  const campaign = useCampaign(jobId);
  if (campaign.isPending) return <span className="text-xs text-text-dim">…</span>;
  if (campaign.isError) return <span className="text-xs text-rose">Couldn&apos;t load</span>;
  if (!campaign.data) return <Pill>Not started</Pill>;
  return <StatusPill status={campaign.data.status} />;
}

export function JobsPanel({ jobs, candidates }: { jobs: Job[]; candidates: Candidate[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>Jobs</CardTitle></CardHeader>
      <CardContent className="divide-y divide-line">
        {jobs.map((j) => (
          <Link key={j.id} href={`/jobs/${j.id}`} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0 hover:text-teal">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{j.title}</p>
              <p className="truncate text-xs text-text-muted">{j.company_name}</p>
            </div>
            <span className="num text-sm text-text-muted">{candidates.filter((c) => c.job_id === j.id).length} candidates</span>
            <StatusPill status={j.status} />
            <CampaignState jobId={j.id} />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
