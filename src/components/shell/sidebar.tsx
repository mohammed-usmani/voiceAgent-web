"use client";

import { FlaskConical, Gauge, Inbox, PanelRightOpen, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useDecisions, useJobs } from "@/lib/api/queries";
import type { JobStatus } from "@/lib/api/types";
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
        "relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-text-muted transition-colors hover:bg-panel-raised hover:text-text max-lg:justify-center max-lg:px-0 max-lg:py-2",
        active && "bg-panel-raised text-text",
      )}
    >
      {icon}
      <span className="truncate max-lg:sr-only">{label}</span>
      {children}
    </Link>
  );
}

const DOT = { teal: "bg-teal", amber: "bg-amber animate-pulse", rose: "bg-rose", muted: "bg-text-dim" } as const;

function JobDot({ status }: { status: JobStatus }) {
  return <span className={cn("size-1.5 shrink-0 rounded-full", DOT[toneOf(status)])} aria-hidden />;
}

/** `onShowActivity`: set when the activity rail is a drawer (below xl), which this button opens. */
export function Sidebar({ onShowActivity }: { onShowActivity?: () => void }) {
  const pathname = usePathname();
  const jobs = useJobs();
  const pending = useDecisions({ status: "pending_review" });
  const { status } = useEvents();
  const pendingCount = pending.data?.length ?? 0;

  return (
    <aside className="flex h-screen flex-col border-r border-line bg-panel">
      <div className="flex items-center gap-2.5 px-5 py-5 max-lg:justify-center max-lg:px-0">
        <span className="glow size-2.5 rounded-full bg-teal" aria-hidden />
        <span className="text-sm font-semibold tracking-wide max-lg:sr-only">Screening</span>
      </div>
      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 px-3 max-lg:px-2" aria-label="Main">
        <NavLink href="/" active={pathname === "/"} icon={<Gauge className="size-4" />} label="Overview" />

        <div className="mt-5 mb-1 flex items-center justify-between px-2.5 text-[11px] tracking-wider text-text-dim uppercase max-lg:justify-center max-lg:px-0">
          <span className="max-lg:sr-only">Jobs</span>
          <Link href="/jobs/new" aria-label="New job" title="New job" className="rounded p-0.5 hover:bg-panel-raised hover:text-text"><Plus className="size-3.5" /></Link>
        </div>
        <div className="min-h-0 overflow-y-auto">
          {jobs.isPending && <div className="space-y-1.5 px-2.5 max-lg:px-1">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-5 w-full" />)}</div>}
          {jobs.isError && <p className="px-2.5 text-xs text-rose max-lg:sr-only">Couldn&apos;t load jobs</p>}
          {jobs.data?.length === 0 && <p className="px-2.5 text-xs text-text-dim max-lg:sr-only">No jobs yet</p>}
          {jobs.data?.map((j) => (
            <NavLink key={j.id} href={`/jobs/${j.id}`} active={pathname.startsWith(`/jobs/${j.id}`)} icon={<JobDot status={j.status} />} label={j.title} />
          ))}
        </div>

        <div className="mt-5 space-y-0.5">
          <NavLink href="/decisions" active={pathname.startsWith("/decisions")} icon={<Inbox className="size-4" />} label="Decisions">
            {pendingCount > 0 && (
              <span className="num ml-auto rounded bg-amber-soft px-1.5 text-xs text-amber max-lg:absolute max-lg:-top-1 max-lg:right-0 max-lg:px-1 max-lg:text-[10px]" aria-label={`${pendingCount} pending`}>
                {pendingCount}
              </span>
            )}
          </NavLink>
          <NavLink href="/evaluation" active={pathname.startsWith("/evaluation")} icon={<FlaskConical className="size-4" />} label="Evaluation" />
        </div>
      </nav>
      <div className="border-t border-line px-5 py-3 max-lg:flex max-lg:flex-col max-lg:items-center max-lg:gap-3 max-lg:px-0">
        {onShowActivity && (
          <button type="button" onClick={onShowActivity} title="Activity (⌘.)" className="mb-2 flex items-center gap-2 rounded text-xs text-text-muted hover:text-text max-lg:mb-0">
            <PanelRightOpen className="size-4" /><span className="max-lg:sr-only">Show activity</span>
          </button>
        )}
        <p className="mb-2 text-[11px] text-text-dim max-lg:hidden"><kbd className="num">⌘K</kbd> jump · <kbd className="num">⌘J</kbd> live wall · <kbd className="num">⌘.</kbd> activity</p>
        <StreamBadge status={status} />
      </div>
    </aside>
  );
}
