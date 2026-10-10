import { Button } from "@/components/ui/button";

export function BackendDown({ onRetry, retrying }: { onRetry: () => void; retrying: boolean }) {
  return (
    <div role="alert" className="grid h-screen place-items-center bg-bg">
      <div className="max-w-md text-center">
        <div className="glow-amber mx-auto mb-6 size-3 animate-pulse rounded-full bg-amber" aria-hidden />
        <h1 className="text-xl font-semibold">Can&apos;t reach the screening backend</h1>
        <p className="mt-2 text-sm text-text-muted">
          Start it with <code className="num text-text">uv run screening-api</code> in the voiceAgent repo, and check
          <code className="num text-text"> SCREENING_API_URL</code> in <code className="num text-text">.env.local</code>.
        </p>
        <Button className="mt-6" onClick={onRetry} disabled={retrying}>{retrying ? "Retrying…" : "Retry"}</Button>
      </div>
    </div>
  );
}
