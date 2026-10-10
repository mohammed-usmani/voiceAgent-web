"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CallingHours } from "@/lib/api/types";
import { localMinutes, toMinutes, withinHours } from "@/lib/campaign";
import { formatClock } from "@/lib/format";
import { useNow } from "@/lib/use-now";
import { cn } from "@/lib/utils";

const C = 90;
const R = 66;

function point(minutes: number, r = R): [number, number] {
  const a = (minutes / 1440) * 2 * Math.PI - Math.PI / 2; // midnight at the top
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
}

export function CallingHoursClock({ hours, timeZone }: { hours: CallingHours; timeZone: string }) {
  const now = new Date(useNow(30_000));
  const open = withinHours(now, hours, timeZone);
  const start = toMinutes(hours.start);
  const end = toMinutes(hours.end);
  const [sx, sy] = point(start);
  const [ex, ey] = point(end);
  const [hx, hy] = point(localMinutes(now, timeZone), R - 16);
  const label = `Calling hours ${hours.start} to ${hours.end}; ${open ? "calling now" : "outside calling hours"}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calling hours</CardTitle>
        <CardDescription className="num">{hours.start}–{hours.end} · {timeZone}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <svg viewBox="0 0 180 180" className="size-44" role="img" aria-label={label}>
          <circle cx={C} cy={C} r={R} fill="none" stroke="var(--line)" strokeWidth={10} />
          <path
            d={`M ${sx} ${sy} A ${R} ${R} 0 ${end - start > 720 ? 1 : 0} 1 ${ex} ${ey}`}
            fill="none"
            stroke="var(--teal)"
            strokeWidth={10}
            strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 6px var(--teal))" }}
          />
          {[0, 6, 12, 18].map((h) => {
            const [x, y] = point(h * 60, R + 16);
            return <text key={h} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={9} fill="var(--text-dim)" className="num">{String(h).padStart(2, "0")}</text>;
          })}
          <line x1={C} y1={C} x2={hx} y2={hy} stroke={open ? "var(--teal)" : "var(--amber)"} strokeWidth={2} strokeLinecap="round" />
          <circle cx={C} cy={C} r={3} fill="var(--text)" />
        </svg>
        <p className="num mt-2 text-2xl">{formatClock(now.toISOString(), timeZone)}</p>
        <p className={cn("text-xs", open ? "text-teal" : "text-amber")}>{open ? "Calling now" : "Outside calling hours"}</p>
      </CardContent>
    </Card>
  );
}
