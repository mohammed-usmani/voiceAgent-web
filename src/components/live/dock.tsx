"use client";

import { Button } from "@/components/ui/button";
import { dockView, type LiveCall } from "@/lib/live/focus";
import { useLiveCall, useLiveCalls } from "@/lib/live/provider";
import { useElapsed } from "@/lib/use-now";
import { cn } from "@/lib/utils";

function DockChip({ call, onClick }: { call: LiveCall; onClick: () => void }) {
  const live = useLiveCall(call.id);
  const elapsed = useElapsed(call.startedAt);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${call.candidateName}, ${elapsed}`}
      className="flex items-center gap-2 rounded-full border border-line-strong bg-panel/95 px-3 py-1.5 text-sm shadow-lg backdrop-blur hover:border-teal/50"
    >
      <span className={cn("size-2 rounded-full", live.agentState === "speaking" ? "glow bg-teal" : "bg-teal/50")} aria-hidden />
      <span className="max-w-32 truncate">{call.candidateName}</span>
      <span className="num text-xs text-text-muted">{elapsed}</span>
    </button>
  );
}

export function Dock() {
  const { state, dispatch } = useLiveCalls();
  const { shown, more } = dockView(state);
  if (shown.length === 0) return null;
  return (
    <div role="region" aria-label="Other live calls" className="fixed right-6 bottom-4 z-40 flex items-center gap-2">
      {shown.map((c) => <DockChip key={c.id} call={c} onClick={() => dispatch({ type: "focus", callId: c.id })} />)}
      {more > 0 && (
        <Button size="sm" variant="secondary" className="num rounded-full" aria-label={`${more} more calls: open the live wall`} onClick={() => dispatch({ type: "wall", open: true })}>
          +{more}
        </Button>
      )}
    </div>
  );
}
