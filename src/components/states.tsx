import type { LucideIcon } from "lucide-react";
import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { messageOf } from "@/lib/api/errors";

export function EmptyState({ icon: Icon, title, action, children }: { icon?: LucideIcon; title: string; action?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line px-8 py-14 text-center">
      {Icon && <Icon className="mb-4 size-6 text-text-dim" aria-hidden />}
      <p className="font-medium">{title}</p>
      {children && <div className="mt-1 max-w-md text-sm text-text-muted">{children}</div>}
      {action && <div className="mt-5 flex gap-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = "Couldn't load this" }: { error: unknown; onRetry?: () => void; title?: string }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center rounded-xl border border-rose/30 bg-rose-soft px-8 py-12 text-center">
      <AlertTriangle className="mb-3 size-5 text-rose" aria-hidden />
      <p className="font-medium">{title}</p>
      <p className="mt-1 max-w-md text-sm text-text-muted">{messageOf(error)}</p>
      {onRetry && <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => <Skeleton key={i} className="h-11 w-full" />)}
    </div>
  );
}

export function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-4" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => <Skeleton key={i} className="h-36 w-full rounded-xl" />)}
    </div>
  );
}
