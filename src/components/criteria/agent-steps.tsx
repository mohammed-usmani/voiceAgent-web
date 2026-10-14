"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type CriteriaStep, STEP_INFO } from "@/lib/criteria";
import { cn } from "@/lib/utils";

export function AgentSteps({ steps, working }: { steps: CriteriaStep[]; working: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className={cn("size-2 rounded-full bg-teal", working && "glow animate-pulse")} aria-hidden />
          Criteria agent
        </CardTitle>
        <CardDescription>{working ? "Turning the job description into screening criteria" : "How these criteria were made"}</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="relative ml-1.5 border-l border-line">
          {steps.map((s, i) => {
            const current = working && i === steps.length - 1;
            return (
              <motion.li key={s.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="relative pb-5 pl-6 last:pb-0">
                <span className={cn("absolute top-1.5 -left-[5px] size-2.5 rounded-full bg-teal", current && "glow animate-pulse")} aria-hidden />
                <p className="text-sm font-medium">
                  {STEP_INFO[s.step].label}
                  {s.round > 1 && <>{" "}<span className="num ml-1 text-xs text-text-dim">round {s.round}</span></>}
                </p>
                <p className="text-xs text-text-muted">{STEP_INFO[s.step].what}</p>
                {s.summary && <p className="num mt-1 text-xs text-text">{s.summary}</p>}
              </motion.li>
            );
          })}
          {steps.length === 0 && <li className="pl-6 text-sm text-text-muted">Waiting for the criteria agent…</li>}
        </ol>
      </CardContent>
    </Card>
  );
}
