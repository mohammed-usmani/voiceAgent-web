"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";
import { Pill } from "@/components/pill";
import { Transcript } from "@/components/transcript";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { EvalCall } from "@/lib/api/types";
import { type PersonaRow, personaRows } from "@/lib/evals";
import { formatScore, humanize } from "@/lib/format";
import { toneOf } from "@/lib/status";

const outcome = (o: string | null) => (o === null ? "—" : o === "none" ? "No decision" : humanize(o));

function Drilldown({ row, onClose }: { row: PersonaRow | null; onClose: () => void }) {
  const c = row?.call;
  return (
    <Sheet open={row !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[40rem] overflow-y-auto sm:max-w-none">
        {row && c && (
          <>
            <SheetHeader>
              <SheetTitle>{row.name}</SheetTitle>
              <SheetDescription>{humanize(row.kind)} · {row.job}</SheetDescription>
            </SheetHeader>
            <div className="space-y-6 px-4 pb-8">
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div><dt className="text-xs text-text-dim">Expected</dt><dd>{outcome(row.expected)} · ends {humanize(row.expectedEnd ?? "—").toLowerCase()}</dd></div>
                <div><dt className="text-xs text-text-dim">Actual</dt><dd>{outcome(row.actual)} · ended {humanize(row.endReason ?? "—").toLowerCase()} · score <span className="num">{formatScore(c.assessment?.score)}</span></dd></div>
              </dl>
              {c.error && <p className="rounded-md bg-rose-soft p-3 text-sm text-rose">{c.error}</p>}
              {c.assessment && c.assessment.reasons.length > 0 && (
                <ul className="space-y-1.5 text-sm">
                  {c.assessment.reasons.map((r) => (
                    <li key={r.requirement_id} className="flex gap-2">
                      <Pill tone={toneOf(r.verdict === "pass" ? "suitable" : r.verdict === "fail" ? "not_suitable" : "needs_review")}>{r.verdict}</Pill>
                      <span className="text-text-muted">{humanize(r.requirement_id)}</span>
                      {r.quote && <q className="truncate italic">{r.quote}</q>}
                    </li>
                  ))}
                </ul>
              )}
              {c.judgement?.notes && <p className="text-sm text-text-muted">{c.judgement.notes}</p>}
              <div>
                <h3 className="mb-2 text-sm font-medium">Transcript</h3>
                <Transcript turns={c.call?.transcript ?? []} />
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function PersonaTable({ calls }: { calls: EvalCall[] }) {
  const [open, setOpen] = useState<PersonaRow | null>(null);
  const rows = personaRows(calls);
  return (
    <section aria-labelledby="personas-heading" className="space-y-3">
      <h2 id="personas-heading" className="text-sm font-medium text-text-muted">Simulated candidates</h2>
      <div className="rounded-xl border border-line bg-panel">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Persona</TableHead>
              <TableHead>Job</TableHead>
              <TableHead>Expected</TableHead>
              <TableHead>Actual</TableHead>
              <TableHead>Call ended</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.key} className="cursor-pointer" onClick={() => setOpen(r)}>
                <TableCell>{r.match ? <Check className="size-4 text-teal" aria-label="as expected" /> : <X className="size-4 text-rose" aria-label="not as expected" />}</TableCell>
                <TableCell>
                  <button type="button" className="font-medium hover:text-teal" onClick={() => setOpen(r)}>{r.name}</button>
                  <p className="text-xs text-text-dim">{humanize(r.kind)}</p>
                </TableCell>
                <TableCell className="text-sm text-text-muted">{r.job}</TableCell>
                <TableCell className="text-sm">{outcome(r.expected)}</TableCell>
                <TableCell className="text-sm">{outcome(r.actual)}</TableCell>
                <TableCell className="text-sm text-text-muted">{r.error ? <span className="text-rose">error</span> : humanize(r.endReason ?? "—")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Drilldown row={open} onClose={() => setOpen(null)} />
    </section>
  );
}
