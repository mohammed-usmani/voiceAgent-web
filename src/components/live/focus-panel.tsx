"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Maximize2, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useApprovedCriteria, useDecision } from "@/lib/api/queries";
import { focusedCall, type LiveCall } from "@/lib/live/focus";
import { useLiveCall, useLiveCalls } from "@/lib/live/provider";
import { useElapsed } from "@/lib/use-now";
import { cn } from "@/lib/utils";
import { AgentStateBar, glowFor } from "./agent-state";
import { Captions } from "./captions";
import { QuestionChecklist } from "./question-checklist";
import { ResultCard } from "./result-card";
import { TurnTimeline } from "./turn-timeline";
import { Waveform } from "./waveform";

function LiveBody({ call }: { call: LiveCall }) {
  const live = useLiveCall(call.id);
  const { listen, dispatch } = useLiveCalls();
  const criteria = useApprovedCriteria(call.jobId);
  const elapsed = useElapsed(call.startedAt);
  const playing = live.audio === "playing";

  return (
    <>
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <Link href={`/candidates/${call.candidateId}`} className="block truncate font-semibold hover:text-teal">{call.candidateName}</Link>
          <p className="truncate text-xs text-text-muted">{call.jobTitle}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="num text-sm text-text-muted">{elapsed}</span>
          <Button size="icon" variant="ghost" aria-label="Open the live wall" onClick={() => dispatch({ type: "wall", open: true })}><Maximize2 /></Button>
        </div>
      </header>
      {live.status === "unavailable" ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-amber">Live view unavailable — the call is still running</p>
          <p className="mt-1 text-xs text-text-dim">The transcript appears on the candidate&apos;s page after the call.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 px-4 pt-3">
            <div className="w-32 shrink-0"><Waveform levels={live.levels} state={live.agentState} compact /></div>
            <div className="flex-1"><AgentStateBar state={live.agentState} /></div>
          </div>
          <Captions captions={live.captions} />
          <div className="max-h-56 overflow-y-auto border-t border-line">
            <QuestionChecklist requirements={criteria.data?.requirements ?? []} asking={live.asking} asked={live.asked} />
            <TurnTimeline turns={live.turns} />
          </div>
          <footer className="flex items-center justify-between border-t border-line px-4 py-2.5">
            <Button size="sm" variant={playing ? "secondary" : "default"} disabled={live.status !== "live"} onClick={() => listen(call.id, !playing)}>
              {playing ? <><VolumeX />Stop listening</> : <><Volume2 />Listen in</>}
            </Button>
            <span className="text-xs text-text-dim">{live.status === "connecting" ? "Joining…" : live.status === "closed" ? "Room closed" : "Hidden viewer"}</span>
          </footer>
        </>
      )}
    </>
  );
}

/** The result card, with the decision's final result; once it's acted on, the card goes. */
function Ended({ call }: { call: LiveCall }) {
  const { dispatch } = useLiveCalls();
  const decision = useDecision(call.decision?.id).data;
  const settled = decision && decision.status !== "pending_review" ? decision.id : null;
  useEffect(() => {
    if (settled) dispatch({ type: "settled", decisionId: settled });
  }, [settled, dispatch]);
  return <ResultCard call={call} final={decision?.final_result ?? null} onDismiss={() => dispatch({ type: "dismiss", callId: call.id })} />;
}

export function FocusPanel() {
  const { state } = useLiveCalls();
  const call = focusedCall(state);
  const live = useLiveCall(call?.id ?? "");
  return (
    <AnimatePresence>
      {call && (
        <motion.section
          key={call.id}
          aria-label={`Live call with ${call.candidateName}`}
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className={cn(
            "fixed right-6 bottom-20 z-40 w-[30rem] overflow-hidden rounded-2xl border bg-panel/95 shadow-2xl backdrop-blur transition-shadow",
            call.phase === "live" ? glowFor(live.agentState) : "border-line-strong",
          )}
        >
          {call.phase === "live" ? <LiveBody call={call} /> : <Ended call={call} />}
        </motion.section>
      )}
    </AnimatePresence>
  );
}
