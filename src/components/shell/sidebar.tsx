"use client";

import { FlaskConical, Gauge, Inbox, Plus, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveCalls, useDecisions, useJobs } from "@/lib/api/queries";
import type { Job } from "@/lib/api/types";
import { useEvents } from "@/lib/events/provider";
import { toneOf } from "@/lib/status";
import { cn } from "@/lib/utils";
import { StreamBadge } from "./stream-badge";

/** Below lg the sidebar is an icon rail: the label stays for screen readers and as a tooltip. */
function NavLink({ href, active, icon, label, children }: { href: string; active: boolean; icon: ReactNode; label: string; children?: ReactNode }) {
  return (
    <Link
      href={href}
      title={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-text-muted transition-colors hover:bg-panel-raised hover:text-text max-lg:justify-center max-lg:px-0",
        active && "bg-panel-raised text-text shadow-[inset_0_0_0_1px_var(--line-strong)]",
      )}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate max-lg:sr-only">{label}</span>
      {children}
    </Link>
  );
}

const DOT = { teal: "bg-teal", amber: "bg-amber", rose: "bg-rose", muted: "bg-text-dim" } as const;

/** What the job needs next, in a word or two, beside its name. */
function jobHint(job: Job, live: number): { text: string; className: string } | null {
  if (live > 0) return { text: `${live} live`, className: "text-teal" };
  if (job.status === "criteria_ready") return { text: "Approve", className: "text-amber" };
  if (job.status === "generating") return { text: "Drafting", className: "text-amber" };
  if (job.status === "criteria_failed") return { text: "Failed", className: "text-rose" };
  if (job.status === "closed") return { text: "Closed", className: "text-text-dim" };
  return null;
}

/** `onSearch` opens the command palette (also ⌘K). */
export function Sidebar({ onSearch }: { onSearch: () => void }) {
  const pathname = usePathname();
  const jobs = useJobs();
  const active = useActiveCalls();
  const pending = useDecisions({ status: "pending_review" });
  const { status } = useEvents();
  const pendingCount = pending.data?.length ?? 0;
  const liveByJob = new Map<string, number>();
  for (const c of active.data ?? []) liveByJob.set(c.job_id, (liveByJob.get(c.job_id) ?? 0) + 1);

  return (
    <aside className="flex h-screen flex-col gap-5 border-r border-line bg-[#0d1015] px-3.5 py-5 max-lg:px-2">
      <div className="flex items-center gap-2.5 px-2.5 max-lg:justify-center max-lg:px-0">
        <span className="glow size-2.5 rounded-full bg-teal" aria-hidden />
        <span className="text-[15px] font-bold tracking-wide max-lg:sr-only">Screening</span>
      </div>
      <button
        type="button"
        onClick={onSearch}
        title="Search (⌘K)"
        className="flex min-h-10 items-center gap-2.5 rounded-lg border border-line-strong bg-panel px-3 text-sm text-text-dim transition-colors hover:text-text max-lg:justify-center max-lg:px-0"
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 text-left max-lg:sr-only">Search or jump to…</span>
        <kbd className="num rounded border border-line-strong bg-bg px-1.5 py-0.5 text-[11px] max-lg:hidden">⌘K</kbd>
      </button>

      <nav className="flex min-h-0 flex-1 flex-col gap-5" aria-label="Main">
        <div className="space-y-0.5">
          <NavLink href="/" active={pathname === "/"} icon={<Gauge className="size-4 shrink-0" />} label="Today" />
          <NavLink href="/decisions" active={pathname.startsWith("/decisions")} icon={<Inbox className="size-4 shrink-0" />} label="Decisions">
            {pendingCount > 0 && (
              <span className="num rounded-full bg-amber-soft px-2 text-xs font-semibold text-amber max-lg:absolute max-lg:-top-1 max-lg:right-0 max-lg:px-1 max-lg:text-[10px]" aria-label={`${pendingCount} to review`}>
                {pendingCount}
              </span>
            )}
          </NavLink>
          <NavLink href="/evaluation" active={pathname.startsWith("/evaluation")} icon={<FlaskConical className="size-4 shrink-0" />} label="Evaluation" />
        </div>

        <div className="flex min-h-0 flex-col">
          <div className="mb-1.5 flex items-center justify-between pr-1 pl-3 max-lg:justify-center max-lg:p-0">
            <span className="text-xs font-semibold tracking-wider text-text-dim uppercase max-lg:sr-only">Jobs</span>
            <Link href="/jobs/new" aria-label="New job" title="New job" className="grid size-8 place-items-center rounded-md text-text-muted hover:bg-panel-raised hover:text-text">
              <Plus className="size-4" />
            </Link>
          </div>
          <div className="min-h-0 space-y-0.5 overflow-y-auto">
            {jobs.isPending && <div className="space-y-1.5 px-3 max-lg:px-1">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-5 w-full" />)}</div>}
            {jobs.isError && <p className="px-3 text-xs text-rose max-lg:sr-only">Couldn&apos;t load jobs</p>}
            {jobs.data?.length === 0 && <p className="px-3 text-xs text-text-dim max-lg:sr-only">No jobs yet</p>}
            {jobs.data?.map((j) => {
              const live = liveByJob.get(j.id) ?? 0;
              const hint = jobHint(j, live);
              const dot = live > 0 ? "bg-teal animate-pulse" : DOT[toneOf(j.status)];
              return (
                <NavLink key={j.id} href={`/jobs/${j.id}`} active={pathname.startsWith(`/jobs/${j.id}`)} icon={<span className={cn("size-2 shrink-0 rounded-full", dot)} aria-hidden />} label={j.title}>
                  {hint && <span className={cn("num shrink-0 text-xs max-lg:sr-only", hint.className)}>{hint.text}</span>}
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="space-y-2 rounded-xl border border-line bg-panel p-3 max-lg:flex max-lg:flex-col max-lg:items-center max-lg:border-0 max-lg:bg-transparent max-lg:p-0">
        <StreamBadge status={status} />
        <p className="text-[11px] text-text-dim max-lg:hidden"><kbd className="num">⌘J</kbd> every live call at once</p>
      </div>
    </aside>
  );
}
