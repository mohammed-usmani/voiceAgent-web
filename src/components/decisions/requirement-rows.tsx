import { AlertTriangle } from "lucide-react";
import { Pill } from "@/components/pill";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type DecisionRow, LOW_CONFIDENCE, verdictView } from "@/lib/decisions";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export function RequirementRows({ rows }: { rows: DecisionRow[] }) {
  return (
    <div className="rounded-xl border border-line bg-panel">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Requirement</TableHead>
            <TableHead>Verdict</TableHead>
            <TableHead>What they said</TableHead>
            <TableHead>Rule or rubric</TableHead>
            <TableHead className="text-right">Confidence</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const v = verdictView(row);
            return (
              <TableRow key={row.id} className={cn(row.failedHard && "bg-rose-soft")}>
                <TableCell className="align-top">
                  <p className="font-medium">{row.label}</p>
                  {row.hard && <span className="text-[10px] text-amber uppercase">must-have</span>}
                </TableCell>
                <TableCell className="align-top"><Pill tone={v.tone} className="num">{v.label}</Pill></TableCell>
                <TableCell className="max-w-sm align-top text-sm whitespace-normal">
                  {row.quote ? <q className="text-text italic">{row.quote}</q> : <span className="text-text-dim">No answer</span>}
                  {row.inconsistency && (
                    <p className="mt-1 flex items-start gap-1 text-xs text-amber"><AlertTriangle className="mt-0.5 size-3 shrink-0" />{row.inconsistency}</p>
                  )}
                </TableCell>
                <TableCell className="max-w-xs align-top text-sm whitespace-normal text-text-muted">{row.rule}</TableCell>
                <TableCell className={cn("num text-right align-top", row.confidence < LOW_CONFIDENCE && "text-amber")}>{formatPercent(row.confidence)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
