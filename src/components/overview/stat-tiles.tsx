import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatTile({ label, value, sub, live = false, warn = false }: { label: string; value: ReactNode; sub?: ReactNode; live?: boolean; warn?: boolean }) {
  return (
    <div className={cn("rounded-2xl border border-line bg-panel px-5 py-4", live && "glow border-teal/40", warn && "border-amber/30")}>
      <p className="flex items-center gap-2 text-xs font-semibold tracking-wider text-text-dim uppercase">
        {live && <span className="size-1.5 animate-pulse rounded-full bg-teal" aria-hidden />}
        {label}
      </p>
      <p className={cn("num mt-1.5 text-3xl font-medium", live && "text-teal", warn && "text-amber")}>{value}</p>
      {sub && <p className="mt-0.5 truncate text-sm text-text-dim">{sub}</p>}
    </div>
  );
}
