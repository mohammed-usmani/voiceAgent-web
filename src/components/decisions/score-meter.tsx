import { formatScore } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ScoreMeter({ score, pass }: { score: number | null; pass: number | null }) {
  const passed = score !== null && pass !== null && score >= pass;
  return (
    <div className="w-64">
      <div className="flex items-baseline justify-between">
        <span className="text-xs tracking-wider text-text-dim uppercase">Score</span>
        <span className={cn("num text-3xl", passed ? "text-teal" : "text-text")}>{formatScore(score)}</span>
      </div>
      <div className="relative mt-2 h-1.5 rounded-full bg-panel-raised" role="meter" aria-valuemin={0} aria-valuemax={1} aria-valuenow={score ?? undefined} aria-label="Score">
        <div className={cn("absolute inset-y-0 left-0 rounded-full", passed ? "glow bg-teal" : "bg-amber")} style={{ width: `${(score ?? 0) * 100}%` }} />
        {pass !== null && <div className="absolute -top-1 h-3.5 w-px bg-text" style={{ left: `${pass * 100}%` }} />}
      </div>
      <p className="num mt-1 text-right text-xs text-text-dim">pass mark {formatScore(pass)}</p>
    </div>
  );
}
