"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { messageOf } from "@/lib/api/errors";
import { useCreateJob } from "@/lib/api/mutations";
import type { JobCreate } from "@/lib/api/types";

// ponytail: a short list; the backend accepts any IANA zone if one is missing here
const TIME_ZONES = ["Asia/Kolkata", "Asia/Dubai", "Asia/Singapore", "Europe/London", "Europe/Berlin", "America/New_York", "America/Chicago", "America/Los_Angeles", "Australia/Sydney", "UTC"];

const SELECT = "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm";

export default function NewJobPage() {
  const router = useRouter();
  const create = useCreateJob({ quiet: true });
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const f = new FormData(e.currentTarget);
    const text = (k: string) => String(f.get(k) ?? "").trim();
    const body: JobCreate = {
      title: text("title"),
      company_name: text("company_name"),
      description: text("description"),
      recruiter_notes: text("recruiter_notes"),
      timezone: text("timezone"),
      calling_hours: { start: text("start"), end: text("end") },
      ...(text("agent_name") ? { agent_name: text("agent_name") } : {}),
      ...(text("voice") ? { voice: text("voice") } : {}),
    };
    if (body.calling_hours && body.calling_hours.start >= body.calling_hours.end) {
      setError("Calling hours must start before they end.");
      return;
    }
    try {
      const job = await create.mutateAsync(body);
      router.push(`/jobs/${job.id}?tab=criteria`);
    } catch (err) {
      setError(messageOf(err));
    }
  }

  return (
    <>
      <PageHeader title="New job" subtitle="Paste the job description: the criteria agent turns it into screening questions you approve." />
      <form onSubmit={onSubmit} className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-6 p-8">
        <Card>
          <CardHeader>
            <CardTitle>The role</CardTitle>
            <CardDescription>Requirements are only taken from these words, and each one quotes its source.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="description">Job description</Label>
              <Textarea id="description" name="description" required minLength={50} maxLength={20000} rows={16} placeholder="Responsibilities, must-haves, shifts, location, salary…" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="recruiter_notes">Recruiter notes</Label>
              <Textarea id="recruiter_notes" name="recruiter_notes" maxLength={5000} rows={4} placeholder="Anything the description doesn't say: e.g. joining within 30 days matters most." />
            </div>
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Job title</Label>
                <Input id="title" name="title" required minLength={2} maxLength={200} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company_name">Company</Label>
                <Input id="company_name" name="company_name" required maxLength={200} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="agent_name">Agent name</Label>
                <Input id="agent_name" name="agent_name" maxLength={60} placeholder="Aria" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Calling</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="timezone">Time zone</Label>
                <select id="timezone" name="timezone" defaultValue="Asia/Kolkata" className={SELECT}>
                  {TIME_ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="start">Calls from</Label>
                  <Input id="start" name="start" type="time" required defaultValue="10:00" className="num" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="end">until</Label>
                  <Input id="end" name="end" type="time" required defaultValue="19:00" className="num" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="voice">Voice</Label>
                <Input id="voice" name="voice" maxLength={100} placeholder="Cartesia voice id (blank: the default voice)" />
              </div>
            </CardContent>
          </Card>
          {error && <p role="alert" className="rounded-md bg-rose-soft p-3 text-sm text-rose">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={create.isPending}>
            <Sparkles />{create.isPending ? "Creating…" : "Generate criteria"}
          </Button>
        </div>
      </form>
    </>
  );
}
