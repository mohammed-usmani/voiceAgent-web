"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { newlyDocked } from "@/lib/live/focus";
import { useLiveCalls } from "@/lib/live/provider";
import { Dock } from "./dock";
import { FocusPanel } from "./focus-panel";
import { LiveWall } from "./live-wall";

export function LiveLayer() {
  const { state } = useLiveCalls();
  const prev = useRef(state);
  useEffect(() => {
    for (const c of newlyDocked(prev.current, state)) {
      toast(`${c.candidateName} answered`, { description: "In the dock: the call in focus stays on screen." });
    }
    prev.current = state;
  }, [state]);
  return (
    <>
      <FocusPanel />
      <Dock />
      <LiveWall />
    </>
  );
}
