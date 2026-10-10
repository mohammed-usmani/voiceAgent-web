import { describe, expect, it } from "vitest";
import type { TurnPoint } from "@/lib/api/types";
import { applyLive, EMPTY_LIVE, type LiveMessage, medianReplyMs } from "./call-state";

const run = (msgs: LiveMessage[]) => msgs.reduce(applyLive, EMPTY_LIVE);
const turn = (i: number, over: Partial<TurnPoint> = {}): TurnPoint => ({
  i,
  kind: "pause",
  t: i * 3,
  outcome: "respond",
  eot_delay_ms: 500,
  reply_delay_ms: 1000 + i * 100,
  paused_then_resumed: false,
  suspect: null,
  ...over,
});

describe("applyLive", () => {
  it("grows a caption segment in place", () => {
    const s = run([
      { type: "caption", id: "s1", role: "agent", text: "Hi", final: false },
      { type: "caption", id: "s1", role: "agent", text: "Hi Vikram", final: true },
      { type: "caption", id: "s2", role: "candidate", text: "Hello", final: false },
    ]);
    expect(s.captions).toEqual([
      { id: "s1", role: "agent", text: "Hi Vikram", final: true },
      { id: "s2", role: "candidate", text: "Hello", final: false },
    ]);
  });

  it("tracks connection, agent state, levels and audio", () => {
    const s = run([
      { type: "connected" },
      { type: "agentState", state: "speaking" },
      { type: "levels", agent: 0.6, candidate: 0 },
      { type: "audio", state: "playing" },
    ]);
    expect(s).toMatchObject({ status: "live", agentState: "speaking", levels: { agent: 0.6, candidate: 0 }, audio: "playing" });
    expect(applyLive(s, { type: "agentState", state: "dancing" }).agentState).toBe("speaking");
    expect(applyLive(s, { type: "unavailable" }).status).toBe("unavailable");
  });

  it("merges question progress", () => {
    const s = run([
      { type: "progress", asking: "graduate", asked: ["intl_voice_years"] },
      { type: "progress", asking: "night_shifts", asked: ["graduate"] },
    ]);
    expect(s.asking).toBe("night_shifts");
    expect(s.asked).toEqual(["intl_voice_years", "graduate"]);
  });

  it("keeps turns once each, in order", () => {
    const s = run([{ type: "turn", point: turn(2) }, { type: "turn", point: turn(1) }, { type: "turn", point: turn(2) }]);
    expect(s.turns.map((t) => t.i)).toEqual([1, 2]);
  });
});

describe("medianReplyMs", () => {
  it("takes the median reply of the turns the agent answered", () => {
    expect(medianReplyMs([turn(0), turn(1), turn(2), turn(3, { kind: "overlap", outcome: "interrupt" })])).toBe(1100);
    expect(medianReplyMs([turn(0), turn(1)])).toBe(1050);
    expect(medianReplyMs([])).toBeNull();
  });
});
