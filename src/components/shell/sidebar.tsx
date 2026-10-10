"use client";

import { FlaskConical, Gauge, Inbox, Plus } from "lucide-react";
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

function NavLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-text-muted transition-colors hover:bg-panel-raised hover:text-text",
        active && "bg-panel-raised text-text",
      )}
    >
      {children}
    </Link>
  );
}

const DOT = { teal: "bg-teal", amber: "bg-amber animate-pulse", rose: "bg-rose", muted: "bg-text-dim" } as const;

function JobDot({ status }: { status: JobStatus }) {
  return <span className={cn("size-1.5 shrink-0 rounded-full", DOT[toneOf(status)])} aria-hidden />;
}

export function Sidebar() {
  const pathname = usePathname();
  const jobs = useJobs();
  const pending = useDecisions({ status: "pending_review" });
  const { status } = useEvents();
  const pendingCount = pending.data?.length ?? 0;

  return (
    <aside className="flex h-screen flex-col border-r border-line bg-panel">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="glow size-2.5 rounded-full bg-teal" aria-hidden />
        <span className="text-sm font-semibold tracking-wide">Screening</span>
      </div>
      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 px-3" aria-label="Main">
        <NavLink href="/" active={pathname === "/"}><Gauge className="size-4" />Overview</NavLink>

        <div className="mt-5 mb-1 flex items-center justify-between px-2.5 text-[11px] tracking-wider text-text-dim uppercase">
          Jobs
          <Link href="/jobs/new" aria-label="New job" className="rounded p-0.5 hover:bg-panel-raised hover:text-text"><Plus className="size-3.5" /></Link>
        </div>
        <div className="min-h-0 overflow-y-auto">
          {jobs.isPending && <div className="space-y-1.5 px-2.5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-5 w-full" />)}</div>}
          {jobs.isError && <p className="px-2.5 text-xs text-rose">Couldn&apos;t load jobs</p>}
          {jobs.data?.length === 0 && <p className="px-2.5 text-xs text-text-dim">No jobs yet</p>}
          {jobs.data?.map((j) => (
            <NavLink key={j.id} href={`/jobs/${j.id}`} active={pathname.startsWith(`/jobs/${j.id}`)}>
              <JobDot status={j.status} />
              <span className="truncate">{j.title}</span>
            </NavLink>
          ))}
        </div>

        <div className="mt-5 space-y-0.5">
          <NavLink href="/decisions" active={pathname.startsWith("/decisions")}>
            <Inbox className="size-4" />Decisions
            {pendingCount > 0 && <span className="num ml-auto rounded bg-amber-soft px-1.5 text-xs text-amber" aria-label={`${pendingCount} pending`}>{pendingCount}</span>}
          </NavLink>
          <NavLink href="/evaluation" active={pathname.startsWith("/evaluation")}><FlaskConical className="size-4" />Evaluation</NavLink>
        </div>
      </nav>
      <div className="border-t border-line px-5 py-3"><StreamBadge status={status} /></div>
    </aside>
  );
}
