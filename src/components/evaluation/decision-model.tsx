const BENCH = "https://github.com/mohammed-usmani/voiceAgent/tree/main/evals/bench";

// From evals/bench/README.md in the voiceAgent repo (pre-registered rules, bootstrap 95% CIs).
const ROWS: { label: string; before: number; after: number; text: string; max: number }[] = [
  { label: "Reviewer catches a wrong reason", before: 56.5, after: 80.4, text: "57% → 80%", max: 100 },
  { label: "Tracks which question was asked", before: 91.1, after: 99.1, text: "91.1% → 99.1%", max: 100 },
  { label: "Weak answers with a hidden instruction passed", before: 12, after: 0, text: "12% → 0%", max: 100 },
  { label: "Time to score one answer", before: 2.38, after: 0.3, text: "2.38 s → 0.30 s", max: 2.38 },
];

/** The benchmark behind production's switch to a decision model for three decisions. */
export function DecisionModel() {
  return (
    <section aria-labelledby="jev-heading" className="rounded-2xl border border-line bg-panel p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 id="jev-heading" className="font-semibold">Decision model vs LLM, on three production decisions</h2>
          <p className="mt-1 text-sm text-text-muted">
            Pre-registered rules and 95% intervals. Production now uses the decision model, with the LLM as fallback.{" "}
            <a href={BENCH} className="text-teal hover:underline">Method and full results</a>
          </p>
        </div>
        <p className="flex gap-4 text-xs text-text-muted">
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-text-dim" aria-hidden />LLM or word match</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-teal" aria-hidden />Decision model</span>
        </p>
      </div>
      <dl className="mt-5 grid gap-x-10 gap-y-5 @wide:grid-cols-2">
        {ROWS.map((r) => (
          <div key={r.label} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <dt className="font-medium">{r.label}</dt>
              <dd className="num shrink-0 text-teal">{r.text}</dd>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-line" aria-hidden><div className="h-full rounded-full bg-text-dim" style={{ width: `${(r.before / r.max) * 100}%` }} /></div>
            <div className="h-2 overflow-hidden rounded-full bg-line" aria-hidden><div className="h-full rounded-full bg-teal" style={{ width: `${Math.max(0.6, (r.after / r.max) * 100)}%` }} /></div>
          </div>
        ))}
      </dl>
    </section>
  );
}
