"use client";

import Link from "next/link";
import { Pill } from "@/components/pill";
import type { Call, Candidate, Job } from "@/lib/api/types";
import { COLUMNS, groupBoard, nextTry } from "@/lib/campaign";
import { formatClock } from "@/lib/format";
import { cn } from "@/lib/utils";

export function CampaignBoard({ job, candidates, callsByCandidate }: { job: Job; candidates: Candidate[]; callsByCandidate: Record<string, Call[]> }) {
  const board = groupBoard(candidates, callsByCandidate);
  return (
    <div className="grid grid-cols-7 gap-2.5">
      {COLUMNS.map((col) => (
        <section key={col.id} aria-labelledby={`col-${col.id}`} className="min-w-0 rounded-xl border border-line bg-panel">
          <header className="flex items-center justify-between border-b border-line px-3 py-2">
            <h3 id={`col-${col.id}`} className="text-[11px] tracking-wider text-text-dim uppercase">{col.label}</h3>
            <span className="num text-xs text-text-muted">{board[col.id].length}</span>
          </header>
          <ul className="space-y-2 p-2">
            {board[col.id].map(({ candidate: c, last }) => {
              const next = nextTry(c, last, job);
              return (
                <li key={c.id}>
                  <Link
                    href={`/candidates/${c.id}`}
                    className={cn("block rounded-lg border border-line bg-panel-raised p-2.5 hover:border-teal/40", col.id === "on_call" && "glow border-teal/50")}
                  >
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="num mt-0.5 text-[11px] text-text-dim">{last ? `call ${last.attempt}` : "not called"}</p>
                    {next && (
                      <p className="num mt-1 text-[11px] text-amber">
                        {next.kind === "callback" ? "callback " : "next ~"}
                        {formatClock(next.at.toISOString(), job.timezone)}
                      </p>
                    )}
                    {c.excluded_at && <Pill tone="amber" className="mt-1.5">Calling stopped</Pill>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
