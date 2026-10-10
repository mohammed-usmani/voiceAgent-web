"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { isForceable, messageOf } from "@/lib/api/errors";
import { useApproveDecision } from "@/lib/api/mutations";
import type { Decision } from "@/lib/api/types";
import { canApprove } from "@/lib/decisions";

export function ApproveButton({ decision }: { decision: Decision }) {
  const approve = useApproveDecision();
  const [ask, setAsk] = useState<"send" | "force" | null>(null);
  const [why, setWhy] = useState("");
  const check = canApprove(decision);
  const m = decision.message;

  const run = async (force: boolean) => {
    try {
      await approve.mutateAsync({ id: decision.id, force });
    } catch (e) {
      if (isForceable(e)) {
        setWhy(messageOf(e));
        setAsk("force");
      }
    }
  };

  return (
    <>
      <Button disabled={!check.allowed || approve.isPending} title={check.reason ?? undefined} onClick={() => setAsk("send")}><Send />Approve &amp; send</Button>
      <ConfirmDialog
        open={ask === "send"}
        onOpenChange={(open) => !open && setAsk(null)}
        title={`Send the ${m?.kind === "invite" ? "invitation" : "rejection"}?`}
        description={`It goes to ${m?.to ?? "the candidate"} now.`}
        confirmLabel="Approve & send"
        onConfirm={() => void run(false)}
      />
      <ConfirmDialog open={ask === "force"} onOpenChange={(open) => !open && setAsk(null)} title="Send anyway?" description={why} confirmLabel="Send anyway" destructive onConfirm={() => void run(true)} />
    </>
  );
}
