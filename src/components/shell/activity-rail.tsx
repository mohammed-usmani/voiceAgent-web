"use client";

import { AnimatePresence, motion } from "framer-motion";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { describeEvent } from "@/lib/events/describe";
import { useEvents } from "@/lib/events/provider";
import { formatRelative } from "@/lib/format";
import { useNow } from "@/lib/use-now";
import { cn } from "@/lib/utils";

const DOT = { teal: "bg-teal", amber: "bg-amber", rose: "bg-rose", muted: "bg-text-dim" } as const;

function RailBody({ title, onClose, onNavigate }: { title: ReactNode; onClose: () => void; onNavigate?: () => void }) {
  const { recent } = useEvents();
  const now = useNow(30_000);
  return (
    <>
      <header className="flex items-center justify-between px-4 py-4">
        {title}
        <Button variant="ghost" size="icon" aria-label="Hide activity" onClick={onClose}><PanelRightClose /></Button>
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
                    <Link href={v.href} onClick={onNavigate} className="flex gap-2.5 rounded-md px-2 py-1.5 hover:bg-panel-raised">{body}</Link>
                  ) : (
                    <div className="flex gap-2.5 px-2 py-1.5">{body}</div>
                  )}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ol>
      )}
    </>
  );
}

/** A column from xl up; below xl (`overlay`) a drawer over the content, opened from the sidebar or ⌘. */
export function ActivityRail({ open, onOpenChange, overlay }: { open: boolean; onOpenChange: (open: boolean) => void; overlay: boolean }) {
  const close = () => onOpenChange(false);
  if (overlay) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" showCloseButton={false} aria-describedby={undefined} className="w-80 gap-0 border-line bg-panel sm:max-w-none">
          <RailBody title={<SheetTitle className="text-sm font-medium">Activity</SheetTitle>} onClose={close} onNavigate={close} />
        </SheetContent>
      </Sheet>
    );
  }
  if (!open) {
    return (
      <aside className="flex w-12 flex-col items-center border-l border-line bg-panel py-4">
        <Button variant="ghost" size="icon" aria-label="Show activity" onClick={() => onOpenChange(true)}><PanelRightOpen /></Button>
      </aside>
    );
  }
  return (
    <aside className="flex h-screen w-80 flex-col border-l border-line bg-panel" aria-label="Activity">
      <RailBody title={<h2 className="text-sm font-medium">Activity</h2>} onClose={close} />
    </aside>
  );
}
