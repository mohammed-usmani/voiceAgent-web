"use client";

import { Check } from "lucide-react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCampaign, useCandidates, useDecisions } from "@/lib/api/queries";
import type { Job } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export type StepId = "criteria" | "candidates" | "campaign" | "decisions";

/** The job's tabs as numbered steps: done ones show a tick, each shows its count. */
export function JobSteps({ job }: { job: Job }) {
  const candidates = useCandidates(job.id);
  const campaign = useCampaign(job.id);
  const pending = useDecisions({ jobId: job.id, status: "pending_review" });
  const total = candidates.data?.length ?? 0;
  const screened = candidates.data?.filter((c) => ["screened", "decided", "notified"].includes(c.status)).length ?? 0;
  const toReview = pending.data?.length ?? 0;

  const steps: { id: StepId; label: string; done: boolean; count?: string; warn?: boolean }[] = [
    { id: "criteria", label: "Criteria", done: job.status === "active" || job.status === "closed" },
    { id: "candidates", label: "Candidates", done: total > 0, count: total ? String(total) : undefined },
    { id: "campaign", label: "Calls", done: campaign.data?.status === "done", count: total ? `${screened}/${total}` : undefined },
    { id: "decisions", label: "Decisions", done: false, count: toReview ? String(toReview) : undefined, warn: toReview > 0 },
  ];

  return (
    <TabsList aria-label="Job steps" className="mx-8 mt-5 flex h-auto w-auto flex-wrap justify-start gap-1 rounded-xl border border-line bg-[#0d1015] p-1.5 group-data-horizontal/tabs:h-auto">
      {steps.map((s, i) => (
        <TabsTrigger
          key={s.id}
          value={s.id}
          className="h-10 flex-none gap-2.5 rounded-lg px-3.5 text-text-muted hover:bg-panel-raised data-active:bg-panel-raised data-active:text-text data-active:shadow-[inset_0_0_0_1px_var(--line-strong)]"
        >
          <span
            className={cn(
              "num grid size-5.5 place-items-center rounded-full border text-xs",
              s.done ? "border-transparent bg-teal-soft text-teal" : "border-line-strong",
            )}
            aria-hidden
          >
            {s.done ? <Check className="size-3.5" /> : i + 1}
          </span>
          {s.label}
          {s.done && <span className="sr-only">(done)</span>}
          {s.count && <span className={cn("num rounded-full px-1.5 text-xs", s.warn ? "bg-amber-soft font-semibold text-amber" : "text-text-dim")}>{s.count}</span>}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
