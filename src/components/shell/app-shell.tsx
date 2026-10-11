"use client";

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { CommandPalette } from "@/components/command-palette";
import { LiveLayer } from "@/components/live/live-layer";
import { useHealth } from "@/lib/api/queries";
import { useHotkey } from "@/lib/hotkeys";
import { useLiveCalls } from "@/lib/live/provider";
import { cn } from "@/lib/utils";
import { ActivityRail } from "./activity-rail";
import { ActivityToggle } from "./activity-toggle";
import { BackendDown } from "./backend-down";
import { EventToasts } from "./event-toasts";
import { Sidebar } from "./sidebar";
import { useRailOpen } from "./use-rail-open";

export function AppShell({ children }: { children: ReactNode }) {
  const health = useHealth();
  const pathname = usePathname();
  const router = useRouter();
  const [railOpen, setRailOpen, railOverlay] = useRailOpen();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { state, dispatch } = useLiveCalls();
  // the activity feed belongs to Today; elsewhere the page gets the full width
  const today = pathname === "/";
  const toggleRail = () => {
    if (today) setRailOpen(!railOpen);
    else {
      router.push("/");
      setRailOpen(true);
    }
  };
  useHotkey("mod+.", toggleRail);
  useHotkey("mod+j", () => dispatch({ type: "wall", open: !state.wallOpen }));
  useHotkey("mod+k", () => setPaletteOpen((o) => !o));

  if (health.isError) return <BackendDown onRetry={() => void health.refetch()} retrying={health.isFetching} />;
  return (
    // Below lg the sidebar is an icon rail; below xl the activity rail is a drawer over the content.
    // `main` is a size container, so pages lay out by the room they get, not by the window.
    <div className={cn("grid h-screen grid-cols-[3.5rem_minmax(0,1fr)] overflow-hidden lg:grid-cols-[16rem_minmax(0,1fr)]", today && "xl:grid-cols-[16rem_minmax(0,1fr)_auto]")}>
      <Sidebar onSearch={() => setPaletteOpen(true)} />
      <main className="@container min-w-0 overflow-y-auto pb-24">
        <ActivityToggle.Provider value={today && railOverlay ? toggleRail : null}>{children}</ActivityToggle.Provider>
      </main>
      {today && <ActivityRail open={railOpen} onOpenChange={setRailOpen} overlay={railOverlay} />}
      <EventToasts />
      <LiveLayer />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} onToggleRail={toggleRail} />
    </div>
  );
}
