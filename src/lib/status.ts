export type Tone = "teal" | "amber" | "rose" | "muted";

const TEAL = new Set(["active", "suitable", "screened", "decided", "notified", "completed", "sent", "approved", "in_progress", "open"]);
const AMBER = new Set(["generating", "criteria_ready", "needs_review", "pending_review", "overridden", "callback", "no_answer", "ringing", "queued", "calling", "paused", "draft", "sending", "reconnecting"]);
const ROSE = new Set(["criteria_failed", "not_suitable", "failed", "unreachable", "declined_consent", "withdrawn", "error"]);

export function toneOf(status: string): Tone {
  if (TEAL.has(status)) return "teal";
  if (AMBER.has(status)) return "amber";
  if (ROSE.has(status)) return "rose";
  return "muted";
}
