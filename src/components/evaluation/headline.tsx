import type { MetricValue } from "@/lib/api/types";
import { formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

const pct = (v: MetricValue | undefined) => (typeof v === "number" ? `${Math.round(v * 100)}%` : "—");

/** The four numbers a non-specialist asks first, each with what it means in plain words. */
export function Headline({ summary }: { summary: Record<string, MetricValue> }) {
  const cost = summary["cost.per_call_usd"];
  const tiles: { label: string; value: string; plain: string; good?: boolean }[] = [
    { label: "Answers captured", value: pct(summary["capture.accuracy"]), plain: "Hears and records what candidates actually said", good: true },
    { label: "Wrongly rejected", value: pct(summary["decision.false_rejection_rate"]), plain: "Fit candidates turned away by mistake", good: summary["decision.false_rejection_rate"] === 0 },
    { label: "Decision accuracy", value: pct(summary["decision.accuracy"]), plain: "Matches the decision the persona was built to get" },
    { label: "Cost per call", value: formatUsd(typeof cost === "number" ? cost : null), plain: "Model spend for one simulated screen" },
  ];
  return (
    <section aria-label="Headline results" className="grid grid-cols-2 gap-4 @3xl:grid-cols-4">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-2xl border border-line bg-panel px-5 py-4">
          <p className="text-xs font-semibold tracking-wider text-text-dim uppercase">{t.label}</p>
          <p className={cn("num mt-2 text-4xl font-medium tracking-tight", t.good && "text-teal")}>{t.value}</p>
          <p className="mt-1.5 text-sm text-text-muted">{t.plain}</p>
        </div>
      ))}
    </section>
  );
}
