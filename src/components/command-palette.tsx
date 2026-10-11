"use client";

import { useRouter } from "next/navigation";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useAllCandidates, useDecisions, useJobs } from "@/lib/api/queries";
import { useLiveCalls } from "@/lib/live/provider";
import { type PaletteItem, paletteItems } from "@/lib/palette";

const GROUPS: PaletteItem["group"][] = ["Go to", "Live calls", "Jobs", "Candidates", "Decisions to review", "Actions"];

/** Opened by ⌘K or the sidebar's search button; the shell owns `open`. */
export function CommandPalette({ open, onOpenChange: setOpen, onToggleRail }: { open: boolean; onOpenChange: (open: boolean) => void; onToggleRail: () => void }) {
  const router = useRouter();
  const jobs = useJobs();
  const candidates = useAllCandidates(open ? jobs.data : []); // loaded when first opened
  const decisions = useDecisions({ status: "pending_review" });
  const { state, dispatch } = useLiveCalls();

  const items = paletteItems({
    jobs: jobs.data ?? [],
    candidates: candidates.data,
    decisions: decisions.data ?? [],
    live: Object.values(state.calls),
  });

  const run = (item: PaletteItem) => {
    setOpen(false);
    if (item.href) router.push(item.href);
    else if (item.action === "wall") dispatch({ type: "wall", open: true });
    else if (item.action === "rail") onToggleRail();
    else if (item.action === "focus" && item.callId) dispatch({ type: "focus", callId: item.callId });
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Command palette" description="Jump to a job, candidate or decision">
      <CommandInput placeholder="Jump to a job, candidate or decision…" />
      <CommandList>
        <CommandEmpty>Nothing matches.</CommandEmpty>
        {GROUPS.map((group) => {
          const inGroup = items.filter((i) => i.group === group);
          if (inGroup.length === 0) return null;
          return (
            <CommandGroup key={group} heading={group}>
              {inGroup.map((item) => (
                <CommandItem key={item.id} value={`${item.label} ${item.hint ?? ""} ${item.id}`} onSelect={() => run(item)}>
                  <span className="truncate">{item.label}</span>
                  {item.hint && <span className="ml-auto truncate text-xs text-text-dim">{item.hint}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
