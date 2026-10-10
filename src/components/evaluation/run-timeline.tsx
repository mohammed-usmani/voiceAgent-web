"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Pill } from "@/components/pill";
import type { EvalRunSummary } from "@/lib/api/types";
import { headlineChanges, isBetter, metricLabel } from "@/lib/evals";
import { formatDateTime, formatDelta, formatMetric, formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

export function RunTimeline({ runs, selected, onSelect }: { runs: EvalRunSummary[]; selected: string | null; onSelect: (name: string) => void }) {
  const changes = headlineChanges(runs);
  const trend = [...runs].reverse().map((r) => ({
    name: formatDateTime(r.started_at),
    accuracy: typeof r.headline["decision.accuracy"] === "number" ? r.headline["decision.accuracy"] : null,
    recall: typeof r.headline["criteria.recall"] === "number" ? r.headline["criteria.recall"] : null,
  }));
  return (
    <section aria-label="Runs" className="space-y-4">
      {runs.length > 1 && (
        <div className="h-28 rounded-xl border border-line bg-panel px-2 pt-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ left: 0, right: 16 }}>
              <XAxis dataKey="name" hide />
              <YAxis domain={[0, 1]} hide />
              <Tooltip contentStyle={{ background: "var(--panel-raised)", border: "1px solid var(--line-strong)", borderRadius: 8, color: "var(--text)" }} />
              <Line type="monotone" dataKey="accuracy" name="Decision accuracy" stroke="var(--teal)" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
              <Line type="monotone" dataKey="recall" name="Criteria recall" stroke="var(--text-muted)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <ol className="flex gap-3 overflow-x-auto pb-1">
        {runs.map((r) => (
          <li key={r.name} className="w-60 shrink-0">
            <button
              type="button"
              onClick={() => onSelect(r.name)}
              aria-pressed={r.name === selected}
              className={cn("w-full rounded-xl border border-line bg-panel p-3 text-left hover:border-teal/40", r.name === selected && "glow border-teal/60")}
            >
              <div className="flex items-center justify-between">
                <span className="num text-sm">{formatDateTime(r.started_at)}</span>
                {r.offline && <Pill>offline</Pill>}
              </div>
              <p className="num mt-2 text-xs text-text-muted">
                accuracy {formatMetric(r.headline["decision.accuracy"] ?? null)} · {formatUsd(r.cost_usd)}
              </p>
              <ul className="mt-2 space-y-0.5">
                {(changes.get(r.name) ?? []).map((c) => {
                  const better = isBetter(c.metric, c.delta);
                  return (
                    <li key={c.metric} className="flex justify-between gap-2 text-[11px]">
                      <span className="truncate text-text-dim">{metricLabel(c.metric)}</span>
                      <span className={cn("num", better === true ? "text-teal" : better === false ? "text-rose" : "text-text-muted")}>{formatDelta(c.delta)}</span>
                    </li>
                  );
                })}
                {changes.get(r.name)?.length === 0 && <li className="text-[11px] text-text-dim">First run of its kind</li>}
              </ul>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
