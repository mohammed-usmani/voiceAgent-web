import { describe, expect, it } from "vitest";
import { decodeJson, parseProgress, parseTurn } from "./messages";

describe("data topics", () => {
  it("decodes JSON payloads and rejects garbage", () => {
    expect(decodeJson(new TextEncoder().encode('{"a":1}'))).toEqual({ a: 1 });
    expect(decodeJson(new TextEncoder().encode("{oops"))).toBeNull();
  });

  it("reads question progress", () => {
    expect(parseProgress({ asking: "graduate", asked: ["intl_voice_years", 3] })).toEqual({ asking: "graduate", asked: ["intl_voice_years"] });
    expect(parseProgress({ asking: null, asked: [] })).toEqual({ asking: null, asked: [] });
    expect(parseProgress({ asked: "x" })).toBeNull();
  });

  it("reads turn records and fills optional fields", () => {
    expect(parseTurn({ i: 3, kind: "pause", t: 12.5, outcome: "respond", reply_delay_ms: 1800 })).toEqual({
      i: 3,
      kind: "pause",
      t: 12.5,
      outcome: "respond",
      eot_delay_ms: null,
      reply_delay_ms: 1800,
      paused_then_resumed: false,
      suspect: null,
    });
    expect(parseTurn({ i: 1, kind: "monologue", t: 1, outcome: "x" })).toBeNull();
    expect(parseTurn({ i: 1, kind: "pause", t: 1, outcome: "respond", transcript: "never shown" })).not.toHaveProperty("transcript");
  });
});
