"use client";

import { Scale } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useOverrideDecision } from "@/lib/api/mutations";
import type { Decision, FinalResult, Requirement } from "@/lib/api/types";
import { canOverride, finalResult } from "@/lib/decisions";

export function OverrideDialog({
  decision,
  requirements,
}: {
  decision: Decision;
  requirements: Requirement[];
}) {
  const override = useOverrideDecision();
  const weighted = requirements.filter((r) => !r.hard);
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<FinalResult>("suitable");
  const [note, setNote] = useState("");
  const [ids, setIds] = useState<string[]>([]);

  const onOpenChange = (next: boolean) => {
    if (next) {
      setResult(
        finalResult(decision) === "suitable" ? "not_suitable" : "suitable",
      );
      setNote(decision.reviewer_note ?? "");
      // Opt-in: an override about a must-have, or the decision as a whole, used to become a
      // scoring example for every soft question because they all started ticked.
      setIds([]);
    }
    setOpen(next);
  };

  function submit(e: FormEvent) {
    e.preventDefault();
    override.mutate(
      {
        id: decision.id,
        body: {
          result,
          note: note.trim(),
          requirement_ids: weighted.length ? ids : null,
        },
      },
      { onSuccess: () => setOpen(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="secondary" disabled={!canOverride(decision)}>
          <Scale />
          Override
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>Override the result</DialogTitle>
            <DialogDescription>
              This calibrates future scoring: your call becomes an example the
              scorer sees for similar answers.
            </DialogDescription>
          </DialogHeader>
          <RadioGroup
            value={result}
            onValueChange={(v) =>
              setResult(v === "not_suitable" ? "not_suitable" : "suitable")
            }
            className="flex gap-6"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem id="r-suitable" value="suitable" />
              <Label htmlFor="r-suitable">Suitable</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem id="r-not" value="not_suitable" />
              <Label htmlFor="r-not">Not suitable</Label>
            </div>
          </RadioGroup>
          <div className="space-y-1.5">
            <Label htmlFor="o-note">Why</Label>
            <Textarea
              id="o-note"
              required
              maxLength={2000}
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <p className="text-xs text-text-dim">
              Shared with the scorer as an example: never include the
              candidate&apos;s name or anything personal about them.
            </p>
          </div>
          {weighted.length > 0 && (
            <fieldset className="space-y-2">
              <legend className="mb-1 text-sm">
                Which answers is this about?
              </legend>
              <p className="text-xs text-text-dim">
                Tick an answer only if your correction is about how it was
                scored. Corrections about must-haves don&apos;t need ticking:
                they&apos;re rule checks, not learned.
              </p>
              {weighted.map((r) => (
                <div key={r.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`o-${r.id}`}
                    checked={ids.includes(r.id)}
                    onCheckedChange={(checked) =>
                      setIds((cur) =>
                        checked === true
                          ? [...cur, r.id]
                          : cur.filter((x) => x !== r.id),
                      )
                    }
                  />
                  <Label htmlFor={`o-${r.id}`} className="font-normal">
                    {r.label}
                  </Label>
                </div>
              ))}
            </fieldset>
          )}
          <DialogFooter>
            <Button type="submit" disabled={override.isPending || !note.trim()}>
              Save override
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
