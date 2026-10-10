"use client";

import type { ReactNode } from "react";
import { useHealth } from "@/lib/api/queries";
import { ActivityRail } from "./activity-rail";
import { BackendDown } from "./backend-down";
import { LiveLayer } from "@/components/live/live-layer";
import { EventToasts } from "./event-toasts";
import { Sidebar } from "./sidebar";
import { useRailOpen } from "./use-rail-open";

export function AppShell({ children }: { children: ReactNode }) {
  const health = useHealth();
  const [railOpen, setRailOpen] = useRailOpen();
  if (health.isError) return <BackendDown onRetry={() => void health.refetch()} retrying={health.isFetching} />;
  return (
    <div className="grid h-screen grid-cols-[15rem_minmax(0,1fr)_auto] overflow-hidden">
      <Sidebar />
      <main className="min-w-0 overflow-y-auto pb-24">{children}</main>
      <ActivityRail open={railOpen} onOpenChange={setRailOpen} />
      <EventToasts />
      <LiveLayer />
    </div>
  );
}
