import type { ActiveCall, DecisionResult } from "@/lib/api/types";
import { humanize } from "@/lib/format";

export const RESULT_CARD_MS = 5000;
export const DOCK_SIZE = 3;
export const WALL_SIZE = 10;

export interface LiveCall {
  id: string;
  candidateId: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  room: string;
  startedAt: number;
  phase: "live" | "ended";
  endReason: string | null;
  decision: { id: string; result: DecisionResult } | null;
  notAssessed: boolean;
}

export interface FocusState {
  calls: Record<string, LiveCall>;
  order: string[]; // answer order
  focusedId: string | null;
  wallOpen: boolean;
}

export type FocusAction =
  | { type: "sync"; calls: ActiveCall[]; now: number } // GET /calls?status=in_progress came back
  | { type: "ended"; callId: string; reason: string | null; now: number }
  | { type: "decided"; callId: string; decisionId: string; result: DecisionResult }
  | { type: "notAssessed"; callId: string }
  | { type: "advance"; callId: string } // the focused call's result card has had its ~5 s
  | { type: "focus"; callId: string }
  | { type: "dismiss"; callId: string }
  | { type: "wall"; open: boolean };

export const initialFocus: FocusState = { calls: {}, order: [], focusedId: null, wallOpen: false };

const live = (s: FocusState) => s.order.map((id) => s.calls[id]).filter((c): c is LiveCall => c?.phase === "live");

function longestRunning(s: FocusState): string | null {
  return [...live(s)].sort((a, b) => a.startedAt - b.startedAt)[0]?.id ?? null;
}

function without(s: FocusState, id: string): FocusState {
  const calls = { ...s.calls };
  delete calls[id];
  return { ...s, calls, order: s.order.filter((x) => x !== id), focusedId: s.focusedId === id ? null : s.focusedId };
}

/** Only a live call holds the focus: a finished one gives way to a new call. */
function focusIsFree(s: FocusState): boolean {
  return !s.focusedId || s.calls[s.focusedId]?.phase !== "live";
}

function end(s: FocusState, id: string, reason: string | null): FocusState {
  const c = s.calls[id];
  if (!c || c.phase === "ended") return s;
  if (s.focusedId !== id) return without(s, id); // a docked call just leaves the dock
  return { ...s, calls: { ...s.calls, [id]: { ...c, phase: "ended", endReason: reason } } };
}

function toLiveCall(c: ActiveCall, now: number): LiveCall {
  return {
    id: c.id,
    candidateId: c.candidate_id,
    candidateName: c.candidate_name,
    jobId: c.job_id,
    jobTitle: c.job_title,
    room: c.room,
    startedAt: (c.started_at && Date.parse(c.started_at)) || now,
    phase: "live",
    endReason: null,
    decision: null,
    notAssessed: false,
  };
}

function focusOn(s: FocusState, id: string): FocusState {
  const prev = s.focusedId ? s.calls[s.focusedId] : undefined;
  const next = prev && prev.id !== id && prev.phase === "ended" ? without(s, prev.id) : s;
  return { ...next, focusedId: id };
}

export function focusReducer(s: FocusState, a: FocusAction): FocusState {
  switch (a.type) {
    case "sync": {
      const listed = new Set(a.calls.map((c) => c.id));
      let next = s;
      for (const c of live(s)) if (!listed.has(c.id)) next = end(next, c.id, null); // ended while we weren't looking
      const fresh = a.calls.filter((c) => !next.calls[c.id] && !s.calls[c.id]).map((c) => toLiveCall(c, a.now)).sort((x, y) => x.startedAt - y.startedAt);
      for (const c of fresh) {
        next = { ...next, calls: { ...next.calls, [c.id]: c }, order: [...next.order, c.id] };
        if (focusIsFree(next)) next = focusOn(next, c.id);
      }
      return next;
    }
    case "ended":
      return end(s, a.callId, a.reason);
    case "decided": {
      const c = s.calls[a.callId];
      return c ? { ...s, calls: { ...s.calls, [c.id]: { ...c, decision: { id: a.decisionId, result: a.result } } } } : s;
    }
    case "notAssessed": {
      const c = s.calls[a.callId];
      return c ? { ...s, calls: { ...s.calls, [c.id]: { ...c, notAssessed: true } } } : s;
    }
    case "advance": {
      const c = s.calls[a.callId];
      if (s.focusedId !== a.callId || c?.phase !== "ended" || live(s).length === 0) return s;
      const next = without(s, a.callId);
      return { ...next, focusedId: longestRunning(next) };
    }
    case "focus":
      return s.calls[a.callId] ? focusOn(s, a.callId) : s;
    case "dismiss": {
      if (!s.calls[a.callId]) return s;
      const next = without(s, a.callId);
      return next.focusedId ? next : { ...next, focusedId: longestRunning(next) };
    }
    case "wall":
      return { ...s, wallOpen: a.open };
  }
}

export function focusedCall(s: FocusState): LiveCall | null {
  return (s.focusedId && s.calls[s.focusedId]) || null;
}

export function dockView(s: FocusState): { shown: LiveCall[]; more: number } {
  const docked = live(s).filter((c) => c.id !== s.focusedId);
  return { shown: docked.slice(0, DOCK_SIZE), more: Math.max(0, docked.length - DOCK_SIZE) };
}

export function wallView(s: FocusState): LiveCall[] {
  return live(s).slice(0, WALL_SIZE);
}

/** Calls that arrived between two states and went to the dock (they get a toast). */
export function newlyDocked(prev: FocusState, next: FocusState): LiveCall[] {
  return next.order.filter((id) => !prev.calls[id] && id !== next.focusedId).map((id) => next.calls[id]);
}

const ASSESSED = new Set(["completed", "candidate_hung_up", "not_interested"]);

export function resultLine(c: LiveCall): string {
  if (!c.endReason) return "Call ended";
  const label = humanize(c.endReason);
  if (c.notAssessed) return `${label} · not assessed`;
  if (!c.decision && ASSESSED.has(c.endReason)) return `${label} · assessing…`;
  return label;
}
