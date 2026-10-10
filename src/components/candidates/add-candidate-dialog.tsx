"use client";

import { UserPlus } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { messageOf } from "@/lib/api/errors";
import { useAddCandidate } from "@/lib/api/mutations";
import type { CandidateCreate } from "@/lib/api/types";

export function AddCandidateDialog({ jobId }: { jobId: string }) {
  const add = useAddCandidate(jobId, { quiet: true });
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const f = new FormData(e.currentTarget);
    const text = (k: string) => String(f.get(k) ?? "").trim();
    const body: CandidateCreate = {
      name: text("name"),
      email: text("email"),
      resume_text: text("resume_text"),
      ...(text("phone") ? { phone: text("phone") } : {}),
      ...(text("sip_address") ? { sip_address: text("sip_address") } : {}),
    };
    if (!body.phone && !body.sip_address) {
      setError("Give a phone number or a SIP address.");
      return;
    }
    try {
      await add.mutateAsync(body);
      setOpen(false);
    } catch (err) {
      setError(messageOf(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); setError(null); }}>
      <DialogTrigger asChild><Button size="sm"><UserPlus />Add candidate</Button></DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Add a candidate</DialogTitle>
            <DialogDescription>The agent calls the phone number, or the SIP address if there is no number.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="c-name">Name</Label><Input id="c-name" name="name" required maxLength={200} /></div>
            <div className="space-y-1.5"><Label htmlFor="c-email">Email</Label><Input id="c-email" name="email" type="email" required /></div>
            <div className="space-y-1.5"><Label htmlFor="c-phone">Phone</Label><Input id="c-phone" name="phone" placeholder="+919876543210" className="num" /></div>
            <div className="space-y-1.5"><Label htmlFor="c-sip">SIP address</Label><Input id="c-sip" name="sip_address" placeholder="priya@sip.linphone.org" /></div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="c-resume">Résumé</Label><Textarea id="c-resume" name="resume_text" rows={5} maxLength={20000} /></div>
          {error && <p role="alert" className="text-sm text-rose">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={add.isPending}>{add.isPending ? "Adding…" : "Add"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
