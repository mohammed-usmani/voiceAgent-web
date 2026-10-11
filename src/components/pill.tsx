import type { ReactNode } from "react";
import type { DecisionResult } from "@/lib/api/types";
import { RESULT_LABEL } from "@/lib/decisions";
import { humanize } from "@/lib/format";
import { type Tone, toneOf } from "@/lib/status";
import { cn } from "@/lib/utils";

const TONES: Record<Tone | "blue", string> = {
  teal: "bg-teal-soft text-teal",
  amber: "bg-amber-soft text-amber",
  rose: "bg-rose-soft text-rose",
  muted: "bg-panel-raised text-text-muted",
  blue: "bg-blue-soft text-blue",
};

export function Pill({ tone = "muted", className, children }: { tone?: Tone | "blue"; className?: string; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap", TONES[tone], className)}>
      {children}
    </span>
  );
}

export function StatusPill({ status, className }: { status: string; className?: string }) {
  return <Pill tone={toneOf(status)} className={className}>{humanize(status)}</Pill>;
}

export function ResultPill({ result, className }: { result: DecisionResult; className?: string }) {
  return <Pill tone={toneOf(result)} className={className}>{RESULT_LABEL[result]}</Pill>;
}
