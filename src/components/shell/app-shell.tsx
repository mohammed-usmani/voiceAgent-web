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
  const [railOpen, setRailOpen, railOverlay] = useRailOpen();
  const { state, dispatch } = useLiveCalls();
  const toggleRail = () => setRailOpen(!railOpen);
  useHotkey("mod+.", toggleRail);
  useHotkey("mod+j", () => dispatch({ type: "wall", open: !state.wallOpen }));

  if (health.isError) return <BackendDown onRetry={() => void health.refetch()} retrying={health.isFetching} />;
  return (
    // Below lg the sidebar is an icon rail; below xl the activity rail is a drawer over the content.
    // `main` is a size container, so pages lay out by the room they get, not by the window.
    <div className="grid h-screen grid-cols-[3.5rem_minmax(0,1fr)] overflow-hidden lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,1fr)_auto]">
      <Sidebar onShowActivity={railOverlay ? toggleRail : undefined} />
      <main className="@container min-w-0 overflow-y-auto pb-24">{children}</main>
      <ActivityRail open={railOpen} onOpenChange={setRailOpen} overlay={railOverlay} />
      <EventToasts />
      <LiveLayer />
      <CommandPalette onToggleRail={toggleRail} />
    </div>
  );
}
