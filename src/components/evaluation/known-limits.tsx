import { KNOWN_LIMITS } from "@/content/known-limits";

export function KnownLimits() {
  return (
    <section aria-labelledby="limits-heading" className="rounded-xl border border-amber/25 bg-panel p-6">
      <h2 id="limits-heading" className="font-medium">Known limits</h2>
      <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-4">
        {KNOWN_LIMITS.map((l) => (
          <div key={l.title}>
            <dt className="text-sm text-amber">{l.title}</dt>
            <dd className="mt-1 text-sm text-text-muted">{l.body}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
