import type { TurnPoint } from "@/lib/api/types";

export type AgentState = "initializing" | "listening" | "thinking" | "speaking";
const AGENT_STATES: readonly string[] = ["initializing", "listening", "thinking", "speaking"];

export interface Caption {
  id: string;
  role: "agent" | "candidate";
  text: string;
  final: boolean;
}

export interface LiveCallState {
  status: "connecting" | "live" | "unavailable" | "closed";
  agentState: AgentState | null;
  captions: Caption[];
  asking: string | null;
  asked: string[];
  turns: TurnPoint[];
  levels: { agent: number; candidate: number };
  audio: "off" | "playing";
}

export type LiveMessage =
  | { type: "connected" }
  | { type: "unavailable" }
  | { type: "closed" }
  | { type: "caption"; id: string; role: "agent" | "candidate"; text: string; final: boolean }
  | { type: "agentState"; state: string }
  | { type: "progress"; asking: string | null; asked: string[] }
  | { type: "turn"; point: TurnPoint }
  | { type: "levels"; agent: number; candidate: number }
  | { type: "audio"; state: "off" | "playing" };

export const EMPTY_LIVE: LiveCallState = {
  status: "connecting",
  agentState: null,
  captions: [],
  asking: null,
  asked: [],
  turns: [],
  levels: { agent: 0, candidate: 0 },
  audio: "off",
};

const MAX_CAPTIONS = 200;

export function applyLive(s: LiveCallState, m: LiveMessage): LiveCallState {
  switch (m.type) {
    case "connected":
      return { ...s, status: "live" };
    case "unavailable":
      return { ...s, status: "unavailable" };
    case "closed":
      return { ...s, status: "closed", audio: "off" };
    case "caption": {
      const caption: Caption = { id: m.id, role: m.role, text: m.text, final: m.final };
      const i = s.captions.findIndex((c) => c.id === m.id);
      const captions = i >= 0 ? s.captions.map((c, j) => (j === i ? caption : c)) : [...s.captions, caption].slice(-MAX_CAPTIONS);
      return { ...s, captions };
    }
    case "agentState":
      return AGENT_STATES.includes(m.state) ? { ...s, agentState: m.state as AgentState } : s;
    case "progress":
      return { ...s, asking: m.asking, asked: [...new Set([...s.asked, ...m.asked])] };
    case "turn":
      return s.turns.some((t) => t.i === m.point.i) ? s : { ...s, turns: [...s.turns, m.point].sort((a, b) => a.i - b.i) };
    case "levels":
      return { ...s, levels: { agent: m.agent, candidate: m.candidate } };
    case "audio":
      return { ...s, audio: m.state };
  }
}

export function medianReplyMs(turns: TurnPoint[]): number | null {
  const replies = turns
    .filter((t) => t.kind === "pause" && t.outcome === "respond" && t.reply_delay_ms !== null)
    .map((t) => t.reply_delay_ms ?? 0)
    .sort((a, b) => a - b);
  if (replies.length === 0) return null;
  const mid = Math.floor(replies.length / 2);
  return replies.length % 2 ? replies[mid] : (replies[mid - 1] + replies[mid]) / 2;
}
