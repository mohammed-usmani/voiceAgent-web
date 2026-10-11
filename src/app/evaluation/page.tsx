"use client";

import { FlaskConical } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { DecisionMatrix } from "@/components/evaluation/decision-matrix";
import { DecisionModel } from "@/components/evaluation/decision-model";
import { Headline } from "@/components/evaluation/headline";
import { KnownLimits } from "@/components/evaluation/known-limits";
import { PersonaTable } from "@/components/evaluation/persona-table";
import { RunCompare } from "@/components/evaluation/run-compare";
import { RunTimeline } from "@/components/evaluation/run-timeline";
import { StageCards } from "@/components/evaluation/stage-cards";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, SkeletonCards } from "@/components/states";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useEvalRun, useEvalRuns } from "@/lib/api/queries";
import { visibleRuns } from "@/lib/evals";
import { formatUsd } from "@/lib/format";

function Evaluation() {
  const params = useSearchParams();
  const router = useRouter();
  const runs = useEvalRuns();
  const [showOffline, setShowOffline] = useState(false);
  const list = visibleRuns(runs.data ?? [], showOffline);
  const selected = params.get("run") ?? list[0]?.name ?? null;
  const run = useEvalRun(selected);
  const other = useEvalRun(params.get("compare"));

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`/evaluation?${next}`, { scroll: false });
  };

  const header = (
    <PageHeader
      title="Evaluation"
      subtitle="Does it screen well? Every stage measured on reference jobs with simulated candidates, misses included."
      actions={
        <div className="flex items-center gap-2">
          <Switch id="offline" checked={showOffline} onCheckedChange={setShowOffline} />
          <Label htmlFor="offline">Show offline runs</Label>
        </div>
      }
    />
  );

  if (runs.isPending) return <>{header}<div className="p-8"><SkeletonCards count={6} /></div></>;
  if (runs.isError) return <>{header}<div className="p-8"><ErrorState error={runs.error} onRetry={() => void runs.refetch()} /></div></>;
  if (list.length === 0) {
    return (
      <>
        {header}
        <div className="p-8">
          <EmptyState icon={FlaskConical} title="No evaluation runs yet">
            Run <code className="num">uv run screening-eval</code> in the voiceAgent repo; each run appears here.
          </EmptyState>
        </div>
      </>
    );
  }

  const r = run.data;
  return (
    <>
      {header}
      <div className="space-y-8 p-8">
        {r && <Headline summary={r.summary} />}
        <RunTimeline runs={list} selected={selected} onSelect={(name) => setParam("run", name)} />
        {run.isPending && <SkeletonCards count={6} />}
        {run.isError && <ErrorState error={run.error} onRetry={() => void run.refetch()} title="Couldn't load this run" />}
        {r && (
          <>
            <p className="num text-sm text-text-muted">
              {r.config.jobs.length} jobs · {r.config.personas} personas each · {r.config.runs} run{r.config.runs > 1 ? "s" : ""} ·{" "}
              {r.config.offline ? "offline fakes" : "real models"} · {formatUsd(r.cost.usd)}
              {r.comparison.previous && <> · changes against the run before</>}
            </p>
            {r.aborted && <p role="alert" className="rounded-lg border border-amber/30 bg-amber-soft p-3 text-sm text-amber">Stopped early: {r.aborted}. The numbers cover what ran.</p>}
            <StageCards summary={r.summary} comparison={r.comparison.rows} />
            <div className="grid gap-6 @wide:grid-cols-2">
              <DecisionMatrix calls={r.calls} />
              <RunCompare runs={runs.data ?? []} current={r} other={other.data} onPick={(name) => setParam("compare", name)} />
            </div>
            <PersonaTable calls={r.calls} />
          </>
        )}
        {!showOffline && <DecisionModel />}
        <KnownLimits />
      </div>
    </>
  );
}

export default function EvaluationPage() {
  return (
    <Suspense>
      <Evaluation />
    </Suspense>
  );
}
