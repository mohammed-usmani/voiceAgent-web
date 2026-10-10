"use client";

import { ErrorState } from "@/components/states";

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="p-8">
      <ErrorState error={error} title="This page hit an error" onRetry={reset} />
    </div>
  );
}
