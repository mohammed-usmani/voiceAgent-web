import type { Progress, TurnPoint } from "@/lib/api/types";

export const PROGRESS_TOPIC = "screening.progress";
export const TURNS_TOPIC = "screening.turns";

export function decodeJson(bytes: Uint8Array): unknown {
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const numOrNull = (v: unknown) => (typeof v === "number" ? v : null);

export function parseProgress(v: unknown): Progress | null {
  if (!isRecord(v) || !Array.isArray(v.asked)) return null;
  return {
    asking: typeof v.asking === "string" ? v.asking : null,
    asked: v.asked.filter((x): x is string => typeof x === "string"),
  };
}

/** A decision-log record (timings only; any text is dropped). */
export function parseTurn(v: unknown): TurnPoint | null {
  if (!isRecord(v) || typeof v.i !== "number" || typeof v.t !== "number" || typeof v.outcome !== "string") return null;
  if (v.kind !== "pause" && v.kind !== "overlap") return null;
  return {
    i: v.i,
    kind: v.kind,
    t: v.t,
    outcome: v.outcome,
    eot_delay_ms: numOrNull(v.eot_delay_ms),
    reply_delay_ms: numOrNull(v.reply_delay_ms),
    paused_then_resumed: v.paused_then_resumed === true,
    suspect: typeof v.suspect === "string" ? v.suspect : null,
  };
}
