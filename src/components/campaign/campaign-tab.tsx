"use client";

import { Pause, Play } from "lucide-react";
import { useMemo, useState } from "react";
import { Pill, StatusPill } from "@/components/pill";
import { ErrorState, SkeletonCards } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { usePauseCampaign, useStartCampaign } from "@/lib/api/mutations";
import { useCampaign, useCandidates, useCandidatesCalls } from "@/lib/api/queries";
import type { Job } from "@/lib/api/types";
import { humanize } from "@/lib/format";
import { CallingHoursClock } from "./calling-hours-clock";
import { CampaignBoard } from "./campaign-board";

export function CampaignTab({ job }: { job: Job }) {
  const campaign = useCampaign(job.id);
  const candidates = useCandidates(job.id);
  const ids = useMemo(() => candidates.data?.map((c) => c.id) ?? [], [candidates.data]);
  const calls = useCandidatesCalls(ids);
  const start = useStartCampaign(job.id);
  const pause = usePauseCampaign(job.id);
  const [max, setMax] = useState<number | null>(null);

  if (campaign.isPending || candidates.isPending) return <div className="p-8"><SkeletonCards count={3} /></div>;
  if (campaign.isError) return <div className="p-8"><ErrorState error={campaign.error} onRetry={() => void campaign.refetch()} /></div>;
  if (candidates.isError) return <div className="p-8"><ErrorState error={candidates.error} onRetry={() => void candidates.refetch()} /></div>;

  const c = campaign.data;
  const current = max ?? c?.max_concurrent ?? 2;
  const canStart = job.status === "active";
  const counts = Object.entries(c?.candidates ?? {}).filter(([, n]) => (n ?? 0) > 0);

  return (
    <div className="space-y-6 p-8">
      <div className="grid grid-cols-[minmax(0,1fr)_17rem] gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Campaign {c ? <StatusPill status={c.status} /> : <Pill>Not started</Pill>}</CardTitle>
            <CardDescription>
              Calls the job&apos;s candidates within calling hours. Unanswered calls are retried up to 3 times, 2 hours apart; callbacks are made at the time the candidate gave.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-3">
              {c?.status === "active" ? (
                <Button variant="secondary" onClick={() => pause.mutate()} disabled={pause.isPending}><Pause />Pause</Button>
              ) : (
                <Button onClick={() => start.mutate({ maxConcurrent: current })} disabled={!canStart || start.isPending}>
                  <Play />{!c ? "Start campaign" : c.status === "paused" ? "Resume" : "Start again"}
                </Button>
              )}
              {!canStart && <span className="text-sm text-amber">Approve the criteria before calling.</span>}
            </div>
            <div className="flex items-center gap-4">
              <span className="w-36 text-sm text-text-muted">Calls at once</span>
              <Slider
                className="max-w-64"
                min={1}
                max={10}
                step={1}
                value={[current]}
                aria-label="Calls at once"
                onValueChange={([v]) => setMax(v)}
                onValueCommit={([v]) => {
                  if (c?.status === "active") start.mutate({ maxConcurrent: v }, { onSuccess: () => setMax(null) });
                }}
              />
              <span className="num w-6 text-lg">{current}</span>
              <span className="num text-sm text-text-dim">{c?.in_flight ?? 0} in flight</span>
            </div>
            {counts.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {counts.map(([status, n]) => <Pill key={status}>{humanize(status)} <span className="num">{n}</span></Pill>)}
              </div>
            )}
          </CardContent>
        </Card>
        <CallingHoursClock hours={job.calling_hours} timeZone={job.timezone} />
      </div>
      <CampaignBoard job={job} candidates={candidates.data} callsByCandidate={calls.byCandidate} />
    </div>
  );
}
