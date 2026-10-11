import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { highlightSegments } from "@/lib/criteria";
import { cn } from "@/lib/utils";

export function JobDescription({ text, spans, active }: { text: string; spans: { id: string; range: [number, number] }[]; active: string | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Job description</CardTitle>
        {spans.length > 0 && <CardDescription>Highlighted: where each requirement comes from. Point at a requirement to find its line.</CardDescription>}
      </CardHeader>
      <CardContent>
        <p className="text-[15px] leading-7 whitespace-pre-wrap text-text-muted">
          {highlightSegments(text, spans).map((s, i) =>
            s.ids.length ? (
              <mark key={i} className={cn("rounded px-0.5 text-text transition-all", active && s.ids.includes(active) ? "bg-teal/25 text-white shadow-[0_0_0_1px_rgb(110_231_192/0.5)]" : active ? "bg-transparent text-text-muted underline decoration-teal/40 decoration-dashed underline-offset-4" : "bg-teal-soft")}>
                {s.text}
              </mark>
            ) : (
              <span key={i}>{s.text}</span>
            ),
          )}
        </p>
      </CardContent>
    </Card>
  );
}
