"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import Link from "next/link";
import { ResultPill } from "@/components/pill";
import { Button } from "@/components/ui/button";
import { type LiveCall, resultLine } from "@/lib/live/focus";

export function ResultCard({ call, onDismiss }: { call: LiveCall; onDismiss: () => void }) {
  return (
    <div className="p-5" style={{ perspective: 600 }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{call.candidateName}</p>
          <p className="truncate text-xs text-text-muted">{call.jobTitle}</p>
        </div>
        <Button size="icon" variant="ghost" aria-label="Close" onClick={onDismiss}><X /></Button>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        {call.decision ? (
          <motion.div key="verdict" initial={{ rotateX: 90, opacity: 0 }} animate={{ rotateX: 0, opacity: 1 }} transition={{ duration: 0.35 }} className="mt-4">
            <p className="text-[11px] tracking-wider text-text-dim uppercase">Verdict</p>
            <ResultPill result={call.decision.result} className="mt-1.5 px-2.5 py-1 text-base" />
            <div className="mt-4">
              <Button asChild size="sm"><Link href={`/decisions/${call.decision.id}`}>Review decision</Link></Button>
            </div>
          </motion.div>
        ) : (
          <motion.p key="ended" exit={{ rotateX: -90, opacity: 0 }} transition={{ duration: 0.2 }} className="mt-4 text-sm text-text-muted">
            {resultLine(call)}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
