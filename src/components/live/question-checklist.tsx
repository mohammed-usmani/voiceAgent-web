import { Check, Circle } from "lucide-react";
import type { Requirement } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export function QuestionChecklist({ requirements, asking, asked }: { requirements: Requirement[]; asking: string | null; asked: string[] }) {
  if (requirements.length === 0) return null;
  const done = requirements.filter((r) => asked.includes(r.id)).length;
  return (
    <div className="px-4 py-3">
      <p className="mb-2 flex items-center justify-between text-[11px] tracking-wider text-text-dim uppercase">
        Questions <span className="num text-xs text-teal normal-case">{done} / {requirements.length} covered</span>
      </p>
      <div className="mb-2.5 h-1 overflow-hidden rounded-full bg-line" aria-hidden>
        <div className="h-full rounded-full bg-teal transition-[width] duration-500" style={{ width: `${(done / requirements.length) * 100}%` }} />
      </div>
      <ul className="-mx-1.5 space-y-0.5 text-sm">
        {requirements.map((r) => {
          const now = asking === r.id;
          const state = now ? "asking" : asked.includes(r.id) ? "asked" : "pending";
          return (
            <li key={r.id} data-state={state} className={cn("flex items-center gap-2 rounded-md px-1.5 py-1", state === "asking" && "bg-teal-soft")}>
              {state === "asked" && <Check className="size-3.5 text-teal" aria-label="asked" />}
              {state === "asking" && <span className="glow size-2 animate-pulse rounded-full bg-teal" aria-label="asking now" />}
              {state === "pending" && <Circle className="size-3 text-text-dim" aria-label="not asked yet" />}
              <span className={cn("truncate", state === "asked" ? "text-text-muted" : state === "asking" ? "text-text" : "text-text-dim")}>{r.label}</span>
              {r.hard && <span className="ml-auto text-[10px] text-amber uppercase">must</span>}
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-[11px] text-text-dim">A guide, not a record: a question asked in other words may tick late.</p>
    </div>
  );
}
