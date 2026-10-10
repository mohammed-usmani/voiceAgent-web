"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { useHotkey } from "@/lib/hotkeys";
import { type LiveCall, wallView } from "@/lib/live/focus";
import { useLiveCall, useLiveCalls } from "@/lib/live/provider";
import { useElapsed } from "@/lib/use-now";
import { cn } from "@/lib/utils";
import { AgentStateLabel, glowFor } from "./agent-state";
import { Waveform } from "./waveform";

function Tile({ call, focused, onFocus }: { call: LiveCall; focused: boolean; onFocus: () => void }) {
  const live = useLiveCall(call.id);
  const elapsed = useElapsed(call.startedAt);
  const last = live.captions.at(-1);
  return (
    <button type="button" onClick={onFocus} className={cn("rounded-xl border bg-panel p-4 text-left transition hover:border-teal/50", glowFor(live.agentState), focused && "ring-1 ring-teal")}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{call.candidateName}</p>
          <p className="truncate text-xs text-text-muted">{call.jobTitle}</p>
        </div>
        <span className="num text-sm text-text-muted">{elapsed}</span>
      </div>
      <Waveform levels={live.levels} state={live.agentState} compact />
      <p className="mt-2 line-clamp-2 h-10 text-sm text-text-muted">{last ? last.text : "…"}</p>
      <div className="mt-2 flex items-center justify-between">
        <AgentStateLabel state={live.agentState} />
        <span className="num text-xs text-text-dim">{live.asked.length} asked</span>
      </div>
    </button>
  );
}

export function LiveWall() {
  const { state, dispatch } = useLiveCalls();
  const calls = wallView(state);
  const close = () => dispatch({ type: "wall", open: false });
  useHotkey("escape", close, state.wallOpen);
  return (
    <AnimatePresence>
      {state.wallOpen && (
        <motion.div role="dialog" aria-label="Live wall" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 overflow-y-auto bg-bg/95 p-8 backdrop-blur">
          <header className="mb-6 flex items-center justify-between">
            <h2 className="flex items-center gap-3 text-xl font-semibold">
              <span className="glow size-2.5 animate-pulse rounded-full bg-teal" aria-hidden />Live calls <span className="num text-text-muted">{calls.length}</span>
            </h2>
            <Button variant="ghost" onClick={close}><X />Close</Button>
          </header>
          {calls.length === 0 ? (
            <EmptyState title="No calls right now">Calls appear here the moment a candidate answers.</EmptyState>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(19rem,1fr))] gap-4">
              {calls.map((c) => (
                <Tile key={c.id} call={c} focused={c.id === state.focusedId} onFocus={() => { dispatch({ type: "focus", callId: c.id }); close(); }} />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
