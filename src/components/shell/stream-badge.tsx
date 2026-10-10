"use client";

import type { StreamStatus } from "@/lib/events/stream";
import { cn } from "@/lib/utils";

const LABEL: Record<StreamStatus, string> = { open: "Live", connecting: "Connecting…", reconnecting: "Reconnecting…" };

export function StreamBadge({ status }: { status: StreamStatus }) {
  return (
    <div data-testid="stream-status" data-status={status} className="flex items-center gap-2 text-xs text-text-muted">
      <span className={cn("size-2 rounded-full", status === "open" ? "bg-teal glow" : status === "reconnecting" ? "animate-pulse bg-amber" : "bg-text-dim")} />
      {LABEL[status]}
    </div>
  );
}
