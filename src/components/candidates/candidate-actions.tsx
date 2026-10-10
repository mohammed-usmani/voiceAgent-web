"use client";

import { Phone, PhoneOff, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { isForceable } from "@/lib/api/errors";
import { useCallCandidate, useDeleteCandidate, useSetExcluded } from "@/lib/api/mutations";
import type { Candidate } from "@/lib/api/types";
import { candidateActions } from "@/lib/candidates";
import { humanize } from "@/lib/format";

export function CandidateActions({ candidate, activeCall, onDeleted }: { candidate: Candidate; activeCall: boolean; onDeleted?: () => void }) {
  const call = useCallCandidate();
  const setExcluded = useSetExcluded();
  const remove = useDeleteCandidate();
  const [askForce, setAskForce] = useState(false);
  const actions = candidateActions(candidate, activeCall);

  const callNow = async (force: boolean) => {
    try {
      await call.mutateAsync({ id: candidate.id, force });
    } catch (e) {
      if (isForceable(e)) setAskForce(true); // their status changed meanwhile
    }
  };

  return (
    <div className="flex items-center justify-end gap-1">
      {actions.call === "call" && (
        <Button size="sm" variant="secondary" disabled={call.isPending} onClick={() => void callNow(false)}><Phone />Call now</Button>
      )}
      {actions.call === "call_again" && (
        <Button size="sm" variant="secondary" disabled={call.isPending} onClick={() => setAskForce(true)}><Phone />Call again</Button>
      )}
      <Button
        size="sm"
        variant="ghost"
        disabled={setExcluded.isPending}
        onClick={() => setExcluded.mutate({ id: candidate.id, excluded: actions.exclude === "stop" })}
      >
        {actions.exclude === "stop" ? <><PhoneOff />Stop calling</> : <><RotateCcw />Resume calling</>}
      </Button>
      <ConfirmDialog
        trigger={<Button size="icon" variant="ghost" aria-label={`Delete ${candidate.name}`}><Trash2 /></Button>}
        title={`Delete ${candidate.name}?`}
        description="This also deletes their call recordings and transcripts."
        confirmLabel="Delete"
        destructive
        onConfirm={() => remove.mutate({ id: candidate.id, jobId: candidate.job_id }, { onSuccess: () => onDeleted?.() })}
      />
      <ConfirmDialog
        open={askForce}
        onOpenChange={setAskForce}
        title={`Call ${candidate.name} again?`}
        description={`They're already ${humanize(candidate.status).toLowerCase()}. A new call starts a new screening.`}
        confirmLabel="Call again"
        onConfirm={() => void callNow(true)}
      />
    </div>
  );
}
