import type { ReactNode } from "react";
import { humanize } from "@/lib/format";
import { type Tone, toneOf } from "@/lib/status";
import { cn } from "@/lib/utils";

const TONES: Record<Tone, string> = {
  teal: "bg-teal-soft text-teal",
  amber: "bg-amber-soft text-amber",
  rose: "bg-rose-soft text-rose",
  muted: "bg-panel-raised text-text-muted",
};

export function Pill({ tone = "muted", className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap", TONES[tone], className)}>
      {children}
    </span>
  );
}

export function StatusPill({ status, className }: { status: string; className?: string }) {
  return <Pill tone={toneOf(status)} className={className}>{humanize(status)}</Pill>;
}
