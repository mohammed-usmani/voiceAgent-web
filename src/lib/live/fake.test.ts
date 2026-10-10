import { describe, expect, it, vi } from "vitest";
import type { LiveMessage } from "./call-state";
import { FAKE_LIVE_EVENT, connectFake } from "./fake";

const send = (room: string, message: LiveMessage) => window.dispatchEvent(new CustomEvent(FAKE_LIVE_EVENT, { detail: { room, message } }));

describe("connectFake", () => {
  it("passes on messages for its room only, until closed", async () => {
    const emit = vi.fn();
    const conn = connectFake("room-a", emit);
    await Promise.resolve();
    expect(emit).toHaveBeenCalledWith({ type: "connected" });
    send("room-a", { type: "agentState", state: "speaking" });
    send("room-b", { type: "agentState", state: "thinking" });
    expect(emit).toHaveBeenCalledWith({ type: "agentState", state: "speaking" });
    expect(emit).not.toHaveBeenCalledWith({ type: "agentState", state: "thinking" });
    await conn.listen(true);
    expect(emit).toHaveBeenCalledWith({ type: "audio", state: "playing" });
    conn.close();
    send("room-a", { type: "agentState", state: "listening" });
    expect(emit).not.toHaveBeenCalledWith({ type: "agentState", state: "listening" });
  });
});
