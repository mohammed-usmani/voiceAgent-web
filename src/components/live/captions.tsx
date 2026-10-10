"use client";

import { useEffect, useRef } from "react";
import type { Caption } from "@/lib/live/call-state";
import { cn } from "@/lib/utils";

export function Captions({ captions, lines = 12 }: { captions: Caption[]; lines?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [captions]);
  if (captions.length === 0) return <p className="h-36 px-4 py-3 text-sm text-text-dim">Captions appear as soon as someone speaks.</p>;
  return (
    <div ref={ref} className="h-36 space-y-2 overflow-y-auto px-4 py-3 text-sm" aria-live="polite">
      {captions.slice(-lines).map((c) => (
        <p key={c.id} className={cn(!c.final && "opacity-70")}>
          <span className={cn("mr-2 text-[11px] tracking-wider uppercase", c.role === "agent" ? "text-teal" : "text-text-muted")}>
            {c.role === "agent" ? "Agent" : "Candidate"}
          </span>
          {c.text}
        </p>
      ))}
    </div>
  );
}
