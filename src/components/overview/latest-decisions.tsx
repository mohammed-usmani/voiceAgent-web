import Link from "next/link";
import { ResultPill, StatusPill } from "@/components/pill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DecisionSummary } from "@/lib/api/types";
import { finalResult } from "@/lib/decisions";
import { formatRelative, formatScore } from "@/lib/format";

export function LatestDecisions({ decisions, now }: { decisions: DecisionSummary[]; now: number }) {
  const latest = [...decisions].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 6);
  return (
    <Card>
      <CardHeader><CardTitle>Latest decisions</CardTitle></CardHeader>
      <CardContent>
        {latest.length === 0 ? (
          <p className="text-sm text-text-dim">Decisions appear here after the first screening calls.</p>
        ) : (
          <ul className="divide-y divide-line">
            {latest.map((d) => (
              <li key={d.id}>
                <Link href={`/decisions/${d.id}`} className="flex items-center gap-3 py-2.5 hover:text-teal">
                  <span className="min-w-0 flex-1 truncate">{d.candidate_name}</span>
                  <span className="num text-sm text-text-muted">{formatScore(d.score)}</span>
                  <ResultPill result={finalResult(d)} />
                  <StatusPill status={d.status} />
                  <span className="num w-20 text-right text-xs text-text-dim">{formatRelative(d.created_at, now)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
