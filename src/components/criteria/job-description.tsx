import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { highlightSegments } from "@/lib/criteria";
import { cn } from "@/lib/utils";

export function JobDescription({ text, spans, active }: { text: string; spans: { id: string; range: [number, number] }[]; active: string | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Job description</CardTitle>
        {spans.length > 0 && <CardDescription>Highlighted: where each requirement comes from</CardDescription>}
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-text-muted">
          {highlightSegments(text, spans).map((s, i) =>
            s.ids.length ? (
              <mark key={i} className={cn("rounded-sm bg-teal-soft px-0.5 text-text transition-colors", active && s.ids.includes(active) && "bg-teal/30 text-teal")}>
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
