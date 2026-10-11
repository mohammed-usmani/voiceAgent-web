import type { ReactNode } from "react";
import { Pill } from "@/components/pill";
import type { Requirement } from "@/lib/api/types";
import { formatPercent } from "@/lib/format";
import { answerKind, ruleText } from "@/lib/rules";
import { cn } from "@/lib/utils";

export function RequirementCard({ r, active, onHover, actions }: { r: Requirement; active: boolean; onHover: (id: string | null) => void; actions?: ReactNode }) {
  return (
    <article
      onMouseEnter={() => onHover(r.id)}
      onMouseLeave={() => onHover(null)}
      // keyboard users get the same source highlight while focus is inside the card
      onFocus={() => onHover(r.id)}
      onBlur={() => onHover(null)}
      className={cn("rounded-2xl border border-line bg-panel p-5 transition", active && "border-teal/50 bg-[#0f1a17] shadow-[0_0_0_3px_rgb(110_231_192/0.08)]")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold">{r.label}</h3>
          <p className="mt-1 text-sm text-text-muted">&ldquo;{r.question}&rdquo;</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {r.hard ? <Pill tone="amber">Must-have</Pill> : <span className="num text-sm text-teal" title="Weight in the score">{formatPercent(r.weight)}</span>}
          {actions}
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-[5.5rem_minmax(0,1fr)] gap-y-1 text-sm">
        <dt className="text-text-dim">{r.hard ? "Rule" : "Scoring"}</dt>
        <dd>{ruleText(r)}</dd>
        <dt className="text-text-dim">Answer</dt>
        <dd>{answerKind(r)}</dd>
      </dl>
      {(r.sensitive || r.disclose) && (
        <div className="mt-3 flex gap-1.5">
          {r.sensitive && <Pill>May decline to answer</Pill>}
          {r.disclose && <Pill>Stated before asking</Pill>}
        </div>
      )}
    </article>
  );
}
