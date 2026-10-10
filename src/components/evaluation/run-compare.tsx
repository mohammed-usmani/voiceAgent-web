"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { EvalResults, EvalRunSummary } from "@/lib/api/types";
import { compareSummaries, isBetter, metricLabel } from "@/lib/evals";
import { formatDateTime, formatDelta, formatMetric } from "@/lib/format";
import { cn } from "@/lib/utils";

const SELECT = "h-8 rounded-md border border-input bg-transparent px-2 text-sm";

export function RunCompare({ runs, current, other, onPick }: { runs: EvalRunSummary[]; current: EvalResults; other: EvalResults | undefined; onPick: (name: string | null) => void }) {
  const choices = runs.filter((r) => r.name !== current.name);
  const rows = other ? compareSummaries(other.summary, current.summary).filter((r) => r.delta !== null && r.delta !== 0) : [];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Compare runs</CardTitle>
        <CardDescription className="flex items-center gap-2">
          This run against
          <select aria-label="Run to compare with" className={SELECT} value={other?.name ?? ""} onChange={(e) => onPick(e.target.value || null)}>
            <option value="">choose a run</option>
            {choices.map((r) => <option key={r.name} value={r.name}>{formatDateTime(r.started_at)}{r.offline ? " (offline)" : ""}</option>)}
          </select>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!other ? (
          <p className="text-sm text-text-dim">Pick a run to see what moved.</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-text-dim">No metric changed.</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-[11px] text-text-dim"><th className="text-left font-normal">Metric</th><th className="text-right font-normal">Then</th><th className="text-right font-normal">Now</th><th className="text-right font-normal">Change</th></tr></thead>
            <tbody>
              {rows.map((r) => {
                const better = r.delta === null ? null : isBetter(r.metric, r.delta);
                return (
                  <tr key={r.metric} className="border-t border-line">
                    <td className="py-1.5 text-text-muted">{metricLabel(r.metric)}</td>
                    <td className="num text-right">{formatMetric(r.a)}</td>
                    <td className="num text-right">{formatMetric(r.b)}</td>
                    <td className={cn("num text-right", better === true ? "text-teal" : better === false ? "text-rose" : "text-text-muted")}>{formatDelta(r.delta)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
