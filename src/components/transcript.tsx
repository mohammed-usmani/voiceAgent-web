import type { TranscriptTurn } from "@/lib/api/types";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Transcript({ turns }: { turns: TranscriptTurn[] }) {
  if (turns.length === 0) return <p className="text-sm text-text-dim">No transcript for this call.</p>;
  const t0 = Date.parse(turns[0].at);
  return (
    <ol className="space-y-2.5 text-sm">
      {turns.map((t, i) => (
        <li key={i} className="grid grid-cols-[3rem_5.5rem_minmax(0,1fr)] gap-2">
          <span className="num text-xs text-text-dim">{formatDuration(Date.parse(t.at) - t0)}</span>
          <span className={cn("text-[11px] tracking-wider uppercase", t.role === "agent" ? "text-teal" : "text-text-muted")}>{t.role === "agent" ? "Agent" : "Candidate"}</span>
          <span>{t.text}</span>
        </li>
      ))}
    </ol>
  );
}
