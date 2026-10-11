import type { AgentState } from "@/lib/live/call-state";
import { cn } from "@/lib/utils";

const LABEL: Record<AgentState, string> = { initializing: "Joining", listening: "Listening", thinking: "Thinking", speaking: "Speaking" };

export function AgentStateLabel({ state }: { state: AgentState | null }) {
  const s = state ?? "initializing";
  return (
    <span className="flex items-center gap-1.5 text-xs text-text-muted">
      <span className={cn("size-2 rounded-full", s === "speaking" ? "glow bg-teal" : s === "thinking" ? "animate-pulse bg-teal/70" : "bg-teal/40")} aria-hidden />
      {LABEL[s]}
    </span>
  );
}

/** The glow around a call: bright while the agent speaks, pulsing while it thinks. */
export function glowFor(state: AgentState | null): string {
  if (state === "speaking") return "glow border-teal/60";
  if (state === "thinking") return "border-teal/30 animate-pulse";
  return "border-line-strong";
}

const STEPS: AgentState[] = ["listening", "thinking", "speaking"];

/** Where the agent is in the turn, as three lit-up steps: easier to read at a glance than a word. */
export function AgentStateBar({ state }: { state: AgentState | null }) {
  return (
    <div role="status" aria-label={`Agent: ${LABEL[state ?? "initializing"].toLowerCase()}`} className="flex gap-1 rounded-lg border border-line bg-bg p-1">
      {STEPS.map((s) => (
        <span key={s} aria-hidden className={cn("flex-1 rounded-md py-1 text-center text-xs font-medium text-text-dim transition-colors", state === s && "bg-teal font-semibold text-teal-ink")}>
          {LABEL[s]}
        </span>
      ))}
    </div>
  );
}
