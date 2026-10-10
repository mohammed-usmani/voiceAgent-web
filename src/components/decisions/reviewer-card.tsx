import { ShieldAlert, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AgentReview } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export function ReviewerCard({ review }: { review: AgentReview | null }) {
  if (!review) return null;
  return (
    <Card className={cn(!review.agree && "border-amber/40")}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {review.agree ? <ShieldCheck className="size-4 text-teal" /> : <ShieldAlert className="size-4 text-amber" />}
          {review.agree ? "The reviewer agreed" : "The reviewer challenged this"}
        </CardTitle>
        <CardDescription>A second agent reads the call before a result goes out</CardDescription>
      </CardHeader>
      {review.notes && (
        <CardContent>
          <p className="text-sm">{review.notes}</p>
          <p className="mt-2 truncate text-xs text-text-dim">{review.model}</p>
        </CardContent>
      )}
    </Card>
  );
}
