import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { EvalComparisonRow, MetricValue } from "@/lib/api/types";
import { formatMetricValue, isBetter, stageCards } from "@/lib/evals";
import { formatDelta } from "@/lib/format";
import { cn } from "@/lib/utils";

export function StageCards({ summary, comparison }: { summary: Record<string, MetricValue>; comparison: EvalComparisonRow[] }) {
  const deltas = new Map(comparison.map((r) => [r.metric, r.delta]));
  return (
    <div className="grid grid-cols-2 gap-4 @wide:grid-cols-3">
      {stageCards(summary).map((stage) => (
        <Card key={stage.id}>
          <CardHeader>
            <CardTitle><h2>{stage.title}</h2></CardTitle>
            <CardDescription>{stage.blurb}</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-1.5">
              {stage.metrics.map((m) => {
                const delta = deltas.get(m.key) ?? null;
                const better = delta === null ? null : isBetter(m.key, delta);
                return (
                  <div key={m.key} className="flex items-baseline justify-between gap-3 text-sm">
                    <dt className="truncate text-text-muted">{m.label}</dt>
                    <dd className="flex items-baseline gap-2">
                      <span className={cn("num", m.format === "pass" && (m.value === true ? "text-teal" : m.value === false ? "text-rose" : "text-amber"))}>{formatMetricValue(m)}</span>
                      {delta !== null && delta !== 0 && (
                        <span className={cn("num text-[11px]", better === true ? "text-teal" : better === false ? "text-rose" : "text-text-dim")}>{formatDelta(delta)}</span>
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
