import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatTile({ label, value, sub, live = false, warn = false }: { label: string; value: ReactNode; sub?: ReactNode; live?: boolean; warn?: boolean }) {
  return (
    <div className={cn("rounded-xl border border-line bg-panel p-4", live && "glow border-teal/40", warn && "border-amber/30")}>
      <p className="flex items-center gap-2 text-xs tracking-wider text-text-dim uppercase">
        {live && <span className="size-1.5 animate-pulse rounded-full bg-teal" aria-hidden />}
        {label}
      </p>
      <p className={cn("num mt-2 text-3xl", live && "text-teal", warn && "text-amber")}>{value}</p>
      {sub && <p className="mt-1 truncate text-xs text-text-dim">{sub}</p>}
    </div>
  );
}
