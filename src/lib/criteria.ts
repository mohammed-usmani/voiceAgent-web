import type { ApiEvent, CriteriaStepName, Job } from "./api/types";
import { humanize } from "./format";

const fold = (c: string) => c.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').toLowerCase();

/** Where `quote` appears in `text`, ignoring case, curly quotes and runs of whitespace. */
export function findQuote(text: string, quote: string): [number, number] | null {
  const q = fold(quote).replace(/\s+/g, " ").trim();
  if (!q) return null;
  let flat = "";
  const at: number[] = []; // index in `text` of each char of `flat`
  for (let i = 0; i < text.length; i++) {
    const c = fold(text[i]);
    if (/\s/.test(c)) {
      if (flat === "" || flat.endsWith(" ")) continue;
      flat += " ";
      at.push(i);
    } else {
      for (const ch of c) {
        flat += ch;
        at.push(i);
      }
    }
  }
  const start = flat.indexOf(q);
  if (start < 0) return null;
  return [at[start], at[start + q.length - 1] + 1];
}

export interface Segment {
  text: string;
  ids: string[];
}

export function highlightSegments(text: string, spans: { id: string; range: [number, number] }[]): Segment[] {
  const cuts = new Set([0, text.length]);
  for (const s of spans) {
    cuts.add(s.range[0]);
    cuts.add(s.range[1]);
  }
  const points = [...cuts].sort((a, b) => a - b);
  const out: Segment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const ids = spans.filter((s) => s.range[0] <= a && b <= s.range[1]).map((s) => s.id);
    const prev = out.at(-1);
    if (prev && prev.ids.join() === ids.join()) prev.text += text.slice(a, b);
    else out.push({ text: text.slice(a, b), ids });
  }
  return out;
}

/** The text requirement sources quote from: the description, then the recruiter's notes. */
export function sourceText(job: Pick<Job, "description" | "recruiter_notes">): string {
  return job.recruiter_notes.trim() ? `${job.description}\n\nRecruiter notes\n${job.recruiter_notes}` : job.description;
}

export interface RemovedLine {
  id: string;
  kind: string;
  detail: string;
}

const REMOVED = /^([a-z][a-z0-9_]*): removed \(([^:]+): (.*)\)$/s;

export function parseWarnings(warnings: string[]): { removed: RemovedLine[]; other: string[] } {
  const removed: RemovedLine[] = [];
  const other: string[] = [];
  for (const w of warnings) {
    const m = REMOVED.exec(w);
    if (m) removed.push({ id: m[1], kind: m[2], detail: m[3] });
    else other.push(w);
  }
  return { removed, other };
}

export const STEP_INFO: Record<CriteriaStepName, { label: string; what: string }> = {
  retrieve: { label: "Retrieve", what: "Looks up approved criteria of similar roles" },
  draft: { label: "Draft", what: "Writes requirements from the job description" },
  critique: { label: "Critique", what: "Checks legality, grounding, rules and units" },
  revise: { label: "Revise", what: "Fixes what the critique found" },
  finalize: { label: "Finalize", what: "Drops anything still illegal or ungrounded" },
};

function isStep(v: unknown): v is CriteriaStepName {
  return typeof v === "string" && v in STEP_INFO;
}

export function summaryText(summary: unknown): string {
  if (typeof summary === "string") return summary;
  if (typeof summary !== "object" || summary === null || Array.isArray(summary)) return "";
  const part = ([k, v]: [string, unknown]): string => {
    if (v === null || v === undefined || v === "") return "";
    if (Array.isArray(v)) return `${humanize(k).toLowerCase()} ${v.length}`;
    // a breakdown such as the critique's {"kinds": {"ungrounded": 1}}: name each entry, not the key
    if (typeof v === "object") return Object.entries(v).map(part).filter(Boolean).join(", ");
    return `${humanize(k).toLowerCase()} ${String(v)}`;
  };
  return Object.entries(summary).map(part).filter(Boolean).join(" · ");
}

export interface CriteriaStep {
  id: number;
  step: CriteriaStepName;
  round: number;
  summary: string;
  at: string;
}

/** The criteria agent's steps for this job since generation last started, oldest first.
 * `events` is the provider's buffer (newest first). */
export function criteriaSteps(events: ApiEvent[], jobId: string): CriteriaStep[] {
  const mine = events.filter((e) => e.entity === "job" && e.entity_id === jobId).sort((a, b) => a.id - b.id);
  const start = mine.findLastIndex((e) => e.type === "created" || e.type === "criteria_regenerating");
  return mine.slice(start + 1).flatMap((e) => {
    if (e.type !== "criteria_step" || !isStep(e.data.step)) return [];
    const round = typeof e.data.round === "number" ? e.data.round : 1;
    return [{ id: e.id, step: e.data.step, round, summary: summaryText(e.data.summary), at: e.created_at }];
  });
}
