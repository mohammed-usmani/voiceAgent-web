"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { OutcomeBucket } from "@/lib/overview";
import type { Tone } from "@/lib/status";

const FILL: Record<Tone, string> = { teal: "var(--teal)", amber: "var(--amber)", rose: "var(--rose)", muted: "var(--text-dim)" };

export function OutcomeChart({ buckets }: { buckets: OutcomeBucket[] }) {
  const empty = buckets.every((b) => b.count === 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Calls by outcome</CardTitle>
        <CardDescription>Each candidate&apos;s latest result</CardDescription>
      </CardHeader>
      <CardContent>
        {empty ? (
          <p className="py-16 text-center text-sm text-text-dim">Outcomes appear after the first calls.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={buckets} layout="vertical" margin={{ left: 4, right: 16 }}>
              <XAxis type="number" allowDecimals={false} stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="label" width={92} stroke="var(--text-dim)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: "var(--panel-raised)" }}
                contentStyle={{ background: "var(--panel-raised)", border: "1px solid var(--line-strong)", borderRadius: 8, color: "var(--text)" }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                {buckets.map((b) => <Cell key={b.key} fill={FILL[b.tone]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
