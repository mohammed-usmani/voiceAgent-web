"use client";

import { useState } from "react";
import { StatusPill } from "@/components/pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useEditMessage } from "@/lib/api/mutations";
import type { Decision } from "@/lib/api/types";
import { finalResult } from "@/lib/decisions";
import { formatDateTime } from "@/lib/format";

export function MessageEditor({ decision }: { decision: Decision }) {
  const m = decision.message;
  const edit = useEditMessage();
  const [draft, setDraft] = useState<{ subject: string; body: string } | null>(null);

  if (!m) {
    return (
      <Card>
        <CardHeader><CardTitle>Message</CardTitle></CardHeader>
        <CardContent>
          {finalResult(decision) === "needs_review" ? (
            <p className="text-sm text-text-muted">This one needs your call: use Override to choose a result, and a message is drafted for it.</p>
          ) : (
            <div className="space-y-2" aria-label="Drafting the message"><Skeleton className="h-8 w-full" /><Skeleton className="h-32 w-full" /></div>
          )}
        </CardContent>
      </Card>
    );
  }

  const editable = m.status === "draft" || m.status === "failed";
  const value = draft ?? { subject: m.subject, body: m.body };
  const dirty = draft !== null && (draft.subject !== m.subject || draft.body !== m.body);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">{m.kind === "invite" ? "Invitation" : "Rejection"} <StatusPill status={m.status} /></CardTitle>
        <CardDescription>To {m.to}{m.sent_at && ` · sent ${formatDateTime(m.sent_at)}`}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {m.issues.length > 0 && (
          <ul className="space-y-1 rounded-md bg-amber-soft p-3 text-xs text-amber" aria-label="Checker issues">
            {m.issues.map((i) => <li key={i}>{i}</li>)}
          </ul>
        )}
        {m.error && <p className="text-xs text-rose">{m.error}</p>}
        <Input aria-label="Subject" value={value.subject} disabled={!editable} maxLength={300} onChange={(e) => setDraft({ ...value, subject: e.target.value.replace(/[\r\n]/g, " ") })} />
        <Textarea aria-label="Message body" rows={12} value={value.body} disabled={!editable} onChange={(e) => setDraft({ ...value, body: e.target.value })} />
        {editable && (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" disabled={!dirty} onClick={() => setDraft(null)}>Discard</Button>
            <Button variant="secondary" disabled={!dirty || edit.isPending} onClick={() => edit.mutate({ id: m.id, decisionId: decision.id, ...value }, { onSuccess: () => setDraft(null) })}>
              Save message
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
