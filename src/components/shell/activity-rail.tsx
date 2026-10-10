"use client";

import { AnimatePresence, motion } from "framer-motion";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { describeEvent } from "@/lib/events/describe";
import { useEvents } from "@/lib/events/provider";
import { formatRelative } from "@/lib/format";
import { useNow } from "@/lib/use-now";
import { cn } from "@/lib/utils";

const DOT = { teal: "bg-teal", amber: "bg-amber", rose: "bg-rose", muted: "bg-text-dim" } as const;

export function ActivityRail({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { recent } = useEvents();
  const now = useNow(30_000);

  if (!open) {
    return (
      <aside className="flex w-12 flex-col items-center border-l border-line bg-panel py-4">
        <Button variant="ghost" size="icon" aria-label="Show activity" onClick={() => onOpenChange(true)}><PanelRightOpen /></Button>
      </aside>
    );
  }
  return (
    <aside className="flex h-screen w-80 flex-col border-l border-line bg-panel" aria-label="Activity">
      <header className="flex items-center justify-between px-4 py-4">
        <h2 className="text-sm font-medium">Activity</h2>
        <Button variant="ghost" size="icon" aria-label="Hide activity" onClick={() => onOpenChange(false)}><PanelRightClose /></Button>
      </header>
      {recent.length === 0 ? (
        <p className="px-4 text-sm text-text-dim">Calls, decisions and messages appear here as they happen.</p>
      ) : (
        <ol className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          <AnimatePresence initial={false}>
            {recent.map((e) => {
              const v = describeEvent(e);
              const body = (
                <>
                  <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", DOT[v.tone])} aria-hidden />
                  <span className="min-w-0 flex-1 text-sm">{v.text}</span>
                  <time className="num shrink-0 text-[11px] text-text-dim" dateTime={e.created_at}>{formatRelative(e.created_at, now)}</time>
                </>
              );
              return (
                <motion.li key={e.id} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                  {v.href ? (
                    <Link href={v.href} className="flex gap-2.5 rounded-md px-2 py-1.5 hover:bg-panel-raised">{body}</Link>
                  ) : (
                    <div className="flex gap-2.5 px-2 py-1.5">{body}</div>
                  )}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ol>
      )}
    </aside>
  );
}
