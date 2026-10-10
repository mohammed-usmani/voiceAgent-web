import type { TurnPoint } from "@/lib/api/types";
import { humanize } from "@/lib/format";
import { medianReplyMs } from "@/lib/live/call-state";
import { cn } from "@/lib/utils";

function title(t: TurnPoint): string {
  const reply = t.reply_delay_ms !== null ? `, reply in ${t.reply_delay_ms} ms` : "";
  return `${humanize(t.kind)}: ${t.outcome}${reply}${t.suspect ? ` (${humanize(t.suspect).toLowerCase()})` : ""}`;
}

export function TurnTimeline({ turns }: { turns: TurnPoint[] }) {
  if (turns.length === 0) return null;
  const end = Math.max(...turns.map((t) => t.t), 1);
  const median = medianReplyMs(turns);
  return (
    <div className="border-t border-line px-4 py-3">
      <p className="mb-2 flex items-center justify-between text-[11px] tracking-wider text-text-dim uppercase">
        Turn-taking
        <span className="num normal-case">{median === null ? "—" : `median reply ${(median / 1000).toFixed(2)} s`}</span>
      </p>
      <div className="relative h-4">
        <div className="absolute inset-x-0 top-1/2 h-px bg-line" />
        {turns.map((t) => (
          <span
            key={t.i}
            title={title(t)}
            className={cn("absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full", t.suspect ? "bg-amber" : t.kind === "overlap" ? "bg-text-muted" : "bg-teal")}
            style={{ left: `${(t.t / end) * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
}
