"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Requirement, Rule, RuleOp } from "@/lib/api/types";
import { formatPercent } from "@/lib/format";
import { answerKind, OP_LABEL, OPS_BY_KIND, parseRuleValue, ruleInputHint, ruleValueInput } from "@/lib/rules";

function RequirementForm({ initial, onSave, onCancel }: { initial: Requirement; onSave: (r: Requirement) => void; onCancel: () => void }) {
  const [r, setR] = useState(initial);
  const ops = OPS_BY_KIND[r.kind];
  const [op, setOp] = useState<RuleOp | undefined>(initial.rule?.op ?? ops[0]);
  const [value, setValue] = useState(initial.rule ? ruleValueInput(initial.rule) : "");
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Requirement>(key: K, v: Requirement[K]) => setR((cur) => ({ ...cur, [key]: v }));

  function submit(e: FormEvent) {
    e.preventDefault();
    let rule: Rule | null = null;
    if (r.hard) {
      const parsed = op ? parseRuleValue(r.kind, op, value, r.options) : null;
      if (!op || parsed === null) {
        setError(op ? ruleInputHint(r.kind, op) : "A free-text answer can't be a must-have.");
        return;
      }
      rule = { op, value: parsed };
    } else if (r.kind === "text" && !r.rubric?.trim()) {
      setError("A free-text requirement needs a rubric: what a good answer contains.");
      return;
    }
    onSave({ ...r, rule });
  }

  return (
    <form onSubmit={submit} className="flex h-full flex-col">
      <SheetHeader>
        <SheetTitle>Edit requirement</SheetTitle>
        <SheetDescription>{answerKind(r)} · from &ldquo;{r.source}&rdquo;</SheetDescription>
      </SheetHeader>
      <div className="flex-1 space-y-5 overflow-y-auto px-4">
        <div className="space-y-1.5">
          <Label htmlFor="req-label">Label</Label>
          <Input id="req-label" value={r.label} required onChange={(e) => set("label", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="req-question">How the agent asks it</Label>
          <Textarea id="req-question" value={r.question} required rows={3} onChange={(e) => set("question", e.target.value)} />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="req-hard">Must-have (a knockout if not met)</Label>
          <Switch id="req-hard" checked={r.hard} disabled={ops.length === 0} onCheckedChange={(v) => set("hard", v)} />
        </div>
        {r.hard ? (
          <div className="grid grid-cols-[9rem_minmax(0,1fr)] gap-2">
            <Select value={op} onValueChange={(v) => setOp(ops.find((o) => o === v))}>
              <SelectTrigger aria-label="Rule"><SelectValue /></SelectTrigger>
              <SelectContent>{ops.map((o) => <SelectItem key={o} value={o}>{OP_LABEL[o]}</SelectItem>)}</SelectContent>
            </Select>
            <Input aria-label="Rule value" value={value} placeholder={op ? ruleInputHint(r.kind, op) : ""} onChange={(e) => setValue(e.target.value)} />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Weight in the score</Label>
              <span className="num text-sm text-teal">{formatPercent(r.weight)}</span>
            </div>
            <Slider min={0} max={1} step={0.05} value={[r.weight]} onValueChange={([w]) => set("weight", w)} aria-label="Weight" />
            <p className="text-xs text-text-dim">Weights are rescaled to add up to 100% when saved.</p>
          </div>
        )}
        {!r.hard && (
          <div className="space-y-1.5">
            <Label htmlFor="req-rubric">Rubric: what a good answer contains</Label>
            <Textarea id="req-rubric" value={r.rubric ?? ""} rows={3} onChange={(e) => set("rubric", e.target.value || null)} />
          </div>
        )}
        <div className="flex items-center justify-between">
          <Label htmlFor="req-sensitive">The candidate may decline to answer</Label>
          <Switch id="req-sensitive" checked={r.sensitive} onCheckedChange={(v) => set("sensitive", v)} />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="req-disclose">State the requirement before asking</Label>
          <Switch id="req-disclose" checked={r.disclose} onCheckedChange={(v) => set("disclose", v)} />
        </div>
        {error && <p role="alert" className="text-sm text-rose">{error}</p>}
      </div>
      <SheetFooter className="flex-row justify-end">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save as draft</Button>
      </SheetFooter>
    </form>
  );
}

export function RequirementSheet({ requirement, onClose, onSave }: { requirement: Requirement | null; onClose: () => void; onSave: (r: Requirement) => void }) {
  return (
    <Sheet open={requirement !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[30rem] sm:max-w-none">
        {requirement && <RequirementForm key={requirement.id} initial={requirement} onSave={onSave} onCancel={onClose} />}
      </SheetContent>
    </Sheet>
  );
}
