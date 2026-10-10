"use client";

import { Upload } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { messageOf } from "@/lib/api/errors";
import { useImportCandidates } from "@/lib/api/mutations";
import type { ImportResult } from "@/lib/api/types";

const MAX_BYTES = 2_000_000; // the backend's limit

export function ImportCsvDialog({ jobId }: { jobId: string }) {
  const importCsv = useImportCandidates(jobId, { quiet: true });
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    setError(null);
    setResult(null);
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError("The file is over 2 MB.");
      return;
    }
    try {
      setResult(await importCsv.mutateAsync(await file.text()));
    } catch (e) {
      setError(messageOf(e));
    }
  }

  return (
    <Dialog onOpenChange={() => { setResult(null); setError(null); }}>
      <DialogTrigger asChild><Button size="sm" variant="secondary"><Upload />Import CSV</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import candidates</DialogTitle>
          <DialogDescription>
            UTF-8 CSV with a header row: <span className="num">name, email</span>, and <span className="num">phone</span> or{" "}
            <span className="num">sip_address</span>; <span className="num">resume_text</span> optional. Up to 1000 rows.
          </DialogDescription>
        </DialogHeader>
        <Input type="file" accept=".csv,text/csv" aria-label="CSV file" disabled={importCsv.isPending} onChange={(e) => void onFile(e.target.files?.[0])} />
        {importCsv.isPending && <p className="text-sm text-text-muted">Importing…</p>}
        {error && <p role="alert" className="text-sm text-rose">{error}</p>}
        {result && (
          <div className="space-y-2 text-sm">
            <p className="text-teal">Added <span className="num">{result.created}</span> candidates.</p>
            {result.errors.length > 0 && (
              <ul className="max-h-48 space-y-1 overflow-y-auto rounded-md bg-amber-soft p-3 text-amber">
                {result.errors.map((e) => <li key={e.row}><span className="num">Row {e.row}</span>: {e.errors.join("; ")}</li>)}
              </ul>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
