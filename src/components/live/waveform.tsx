"use client";

import { motion } from "framer-motion";
import type { AgentState } from "@/lib/live/call-state";
import { cn } from "@/lib/utils";

const BARS = 28;

export function Waveform({ levels, state, compact = false }: { levels: { agent: number; candidate: number }; state: AgentState | null; compact?: boolean }) {
  const agentSpeaking = state === "speaking";
  const candidateLouder = levels.candidate > levels.agent && !agentSpeaking;
  const level = Math.max(agentSpeaking ? Math.max(levels.agent, 0.4) : levels.agent, levels.candidate);
  return (
    <div aria-hidden className={cn("flex items-center justify-center gap-[3px] px-4", compact ? "h-6" : "h-14")}>
      {Array.from({ length: BARS }, (_, i) => {
        const envelope = 0.3 + 0.7 * Math.sin((i / (BARS - 1)) * Math.PI);
        const jitter = 0.7 + 0.3 * Math.abs(Math.sin(i * 1.7));
        return (
          <motion.span
            key={i}
            className={cn("h-full w-[3px] rounded-full", candidateLouder ? "bg-text-muted" : "bg-teal")}
            initial={false}
            animate={{ scaleY: Math.max(0.08, level * envelope * jitter) }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
          />
        );
      })}
    </div>
  );
}
