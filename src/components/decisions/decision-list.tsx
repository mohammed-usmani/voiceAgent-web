"use client";

import { Inbox } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ResultPill, StatusPill } from "@/components/pill";
import { ErrorState, SkeletonRows } from "@/components/states";
import { useDecisions, useJobs } from "@/lib/api/queries";
import { finalResult, queueOrder } from "@/lib/decisions";
import { formatRelative } from "@/lib/format";
import { useHotkey } from "@/lib/hotkeys";
import { useNow } from "@/lib/use-now";
import { cn } from "@/lib/utils";

export type ListFilter = "pending" | "all";

/** The decisions inbox beside an open decision. J and K step through it. */
export function DecisionList({ filter, onFilter, selectedId }: { filter: ListFilter; onFilter: (f: ListFilter) => void; selectedId: string | null }) {
  const router = useRouter();
  const decisions = useDecisions(filter === "pending" ? { status: "pending_review" } : {});
  const pendingCount = useDecisions({ status: "pending_review" }).data?.length;
  const jobs = useJobs();
  const now = useNow(60_000);
  const titles = new Map((jobs.data ?? []).map((j) => [j.id, j.title]));
  // To review: the backend's queue order. All: a history, newest first, so it reads differently.
  const queue = !decisions.data
    ? []
    : filter === "pending"
      ? queueOrder(decisions.data)
      : [...decisions.data].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  const at = queue.findIndex((d) => d.id === selectedId);
  const step = (by: number) => {
    const next = queue[Math.min(queue.length - 1, Math.max(0, at + by))];
    if (next && next.id !== selectedId) router.push(`/decisions/${next.id}`);
  };
  useHotkey("j", () => step(1), queue.length > 0);
  useHotkey("k", () => step(-1), queue.length > 0);

  return (
    <section aria-labelledby="decisions-heading" className="flex min-h-0 flex-col gap-4 px-4 py-7">
      <div className="px-2">
        <h1 id="decisions-heading" className="text-2xl font-semibold tracking-tight">Decisions</h1>
        <p className="mt-0.5 text-sm text-text-dim">Every call ends here. Approve to send the message, or override.</p>
      </div>
      <div role="group" aria-label="Show" className="flex gap-1 rounded-lg border border-line bg-panel p-1">
        {(["pending", "all"] as const).map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => onFilter(f)}
            className={cn("h-9 flex-1 rounded-md text-sm font-medium text-text-muted transition-colors hover:text-text", filter === f && "bg-panel-raised text-text")}
          >
            {f === "pending" ? <>To review{pendingCount !== undefined && <span className="num"> · {pendingCount}</span>}</> : "All"}
          </button>
        ))}
      </div>
      {decisions.isPending ? (
        <SkeletonRows rows={4} />
      ) : decisions.isError ? (
        <ErrorState error={decisions.error} onRetry={() => void decisions.refetch()} />
      ) : queue.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line px-4 py-10 text-center text-sm text-text-muted">
          <Inbox className="size-5 text-text-dim" aria-hidden />
          {filter === "pending" ? "Nothing to review. New results land here after each call." : "No decisions yet."}
        </div>
      ) : (
        <ul className="-mx-1 min-h-0 space-y-1 overflow-y-auto px-1">
          {queue.map((d) => (
            <li key={d.id}>
              <Link
                href={`/decisions/${d.id}`}
                aria-current={d.id === selectedId ? "page" : undefined}
                className={cn(
                  "flex flex-col gap-1.5 rounded-xl border border-transparent px-3.5 py-3 transition-colors hover:bg-panel",
                  d.id === selectedId && "border-line-strong bg-panel-raised hover:bg-panel-raised",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate font-semibold">{d.candidate_name}</span>
                  <span className="num shrink-0 text-xs text-text-dim">{formatRelative(d.created_at, now)}</span>
                </span>
                <span className="flex items-center gap-2">
                  <ResultPill result={finalResult(d)} />
                  {filter === "all" && <StatusPill status={d.status} />}
                  <span className="truncate text-sm text-text-dim">{titles.get(d.job_id) ?? ""}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {queue.length > 1 && (
        <p className="mt-auto px-2 text-xs text-text-dim">
          <kbd className="num rounded border border-line-strong px-1">J</kbd> <kbd className="num rounded border border-line-strong px-1">K</kbd> next and previous
        </p>
      )}
    </section>
  );
}
