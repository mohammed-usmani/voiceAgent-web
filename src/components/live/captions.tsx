"use client";

import { useEffect, useRef } from "react";
import type { Caption } from "@/lib/live/call-state";
import { cn } from "@/lib/utils";

export function Captions({ captions, lines = 12 }: { captions: Caption[]; lines?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [captions]);
  if (captions.length === 0) return <p className="h-40 px-4 py-3 text-sm text-text-dim">Captions appear as soon as someone speaks.</p>;
  return (
    <div ref={ref} className="h-40 space-y-2.5 overflow-y-auto px-4 py-3 text-sm leading-relaxed" aria-live="polite">
      {captions.slice(-lines).map((c) => (
        <p key={c.id} className={cn("grid grid-cols-[5.5rem_minmax(0,1fr)] gap-2", !c.final && "opacity-70")}>
          <span className={cn("pt-px text-[11px] font-semibold tracking-wider uppercase", c.role === "agent" ? "text-blue" : "text-teal")}>
            {c.role === "agent" ? "Agent" : "Candidate"}
          </span>
          <span>{c.text}</span>
        </p>
      ))}
    </div>
  );
}
