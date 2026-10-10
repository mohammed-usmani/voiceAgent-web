import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { EvalCall } from "@/lib/api/types";
import { decisionMatrix, OUTCOMES, type Outcome } from "@/lib/evals";
import { cn } from "@/lib/utils";

const LABEL: Record<Outcome, string> = { suitable: "Suitable", not_suitable: "Not suitable", needs_review: "Needs review", none: "No decision" };

export function DecisionMatrix({ calls }: { calls: EvalCall[] }) {
  const m = decisionMatrix(calls);
  const max = Math.max(1, ...OUTCOMES.flatMap((e) => OUTCOMES.map((a) => m.cells[e][a])));
  const rows = OUTCOMES.filter((o) => o !== "none");
  return (
    <Card>
      <CardHeader>
        <CardTitle>Expected vs actual</CardTitle>
        <CardDescription className="num">{m.agree} of {m.total} as expected</CardDescription>
      </CardHeader>
      <CardContent>
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr>
              <th className="w-28 text-left text-[11px] font-normal text-text-dim">expected ↓ actual →</th>
              {OUTCOMES.map((a) => <th key={a} className="pb-2 text-[11px] font-normal text-text-muted">{LABEL[a]}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e}>
                <th className="py-1 text-left text-xs font-normal text-text-muted">{LABEL[e]}</th>
                {OUTCOMES.map((a) => {
                  const n = m.cells[e][a];
                  return (
                    <td key={a} className="p-1">
                      <div
                        className={cn("num grid h-12 place-items-center rounded-md border border-line", e === a ? "text-teal" : n > 0 ? "text-amber" : "text-text-dim")}
                        style={{ background: n > 0 ? `color-mix(in srgb, ${e === a ? "var(--teal)" : "var(--amber)"} ${Math.round((n / max) * 30)}%, transparent)` : undefined }}
                        aria-label={`expected ${LABEL[e]}, got ${LABEL[a]}: ${n}`}
                      >
                        {n}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
