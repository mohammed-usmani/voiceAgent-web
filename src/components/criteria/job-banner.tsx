"use client";

import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRegenerateCriteria } from "@/lib/api/mutations";
import type { Job } from "@/lib/api/types";

/** Shown when the description or notes changed after the criteria were generated. */
export function JobBanner({ job }: { job: Job }) {
  const regenerate = useRegenerateCriteria(job.id);
  if (!job.criteria_stale || job.status === "generating") return null;
  return (
    <div role="status" className="mx-8 mt-4 flex items-center justify-between gap-4 rounded-lg border border-amber/30 bg-amber-soft px-4 py-2.5 text-sm">
      <span className="text-amber">The description changed after these criteria were made.</span>
      <Button size="sm" variant="secondary" onClick={() => regenerate.mutate()} disabled={regenerate.isPending}><RotateCw />Regenerate</Button>
    </div>
  );
}
