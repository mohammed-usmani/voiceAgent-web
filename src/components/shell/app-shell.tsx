"use client";

import type { ReactNode } from "react";
import { CommandPalette } from "@/components/command-palette";
import { LiveLayer } from "@/components/live/live-layer";
import { useHealth } from "@/lib/api/queries";
import { useHotkey } from "@/lib/hotkeys";
import { useLiveCalls } from "@/lib/live/provider";
import { ActivityRail } from "./activity-rail";
import { BackendDown } from "./backend-down";
import { EventToasts } from "./event-toasts";
import { Sidebar } from "./sidebar";
import { useRailOpen } from "./use-rail-open";

export function AppShell({ children }: { children: ReactNode }) {
  const health = useHealth();
  const [railOpen, setRailOpen] = useRailOpen();
  const { state, dispatch } = useLiveCalls();
  const toggleRail = () => setRailOpen(!railOpen);
  useHotkey("mod+.", toggleRail);
  useHotkey("mod+j", () => dispatch({ type: "wall", open: !state.wallOpen }));

  if (health.isError) return <BackendDown onRetry={() => void health.refetch()} retrying={health.isFetching} />;
  return (
    <div className="grid h-screen grid-cols-[15rem_minmax(0,1fr)_auto] overflow-hidden">
      <Sidebar />
      <main className="min-w-0 overflow-y-auto pb-24">{children}</main>
      <ActivityRail open={railOpen} onOpenChange={setRailOpen} />
      <EventToasts />
      <LiveLayer />
      <CommandPalette onToggleRail={toggleRail} />
    </div>
  );
}
