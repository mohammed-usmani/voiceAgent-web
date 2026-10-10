"use client";

import { ErrorState, SkeletonCards } from "@/components/states";
import { useCriteria } from "@/lib/api/queries";
import type { Job } from "@/lib/api/types";
import { CriteriaReview } from "./criteria-review";

export function CriteriaPanel({ job }: { job: Job }) {
  const criteria = useCriteria(job.id);
  if (criteria.isPending) return <div className="p-8"><SkeletonCards count={4} /></div>;
  if (criteria.isError) return <div className="p-8"><ErrorState error={criteria.error} onRetry={() => void criteria.refetch()} /></div>;
  return <CriteriaReview job={job} criteria={criteria.data} />;
}
