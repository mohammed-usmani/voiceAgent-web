import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type EventSourceLike,
  parseEvent,
  startEventStream,
  type StreamStatus,
} from "./stream";

class FakeSource implements EventSourceLike {
  static all: FakeSource[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((m: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;
  closed = false;
  constructor(public url: string) {
    FakeSource.all.push(this);
  }
  close() {
    this.closed = true;
  }
  send(id: number, type = "answered") {
    this.onmessage?.({
      data: JSON.stringify({
        id,
        entity: "call",
        entity_id: "c",
        type,
        data: {},
        created_at: "",
      }),
    });
  }
}

function start() {
  const events: number[] = [];
  const statuses: StreamStatus[] = [];
  const onReconnected = vi.fn();
  const stop = startEventStream({
    url: "/api/events/stream",
    open: (url) => new FakeSource(url),
    onEvent: (e) => events.push(e.id),
    onStatus: (s) => statuses.push(s),
    onReconnected,
  });
  return { events, statuses, onReconnected, stop };
}

beforeEach(() => {
  FakeSource.all = [];
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

describe("startEventStream", () => {
  it("delivers parsed events once, in order", () => {
    const s = start();
    const src = FakeSource.all[0];
    src.onopen?.();
    src.send(5);
    src.send(6);
    src.send(6);
    src.onmessage?.({ data: "not json" });
    expect(s.events).toEqual([5, 6]);
    expect(s.statuses).toEqual(["connecting", "open"]);
  });

  it("reconnects after the last event id", () => {
    const s = start();
    FakeSource.all[0].onopen?.();
    FakeSource.all[0].send(41);
    FakeSource.all[0].onerror?.();
    expect(FakeSource.all[0].closed).toBe(true);
    expect(s.statuses.at(-1)).toBe("reconnecting");
    vi.advanceTimersByTime(1000);
    expect(FakeSource.all[1].url).toBe("/api/events/stream?after=41");
    FakeSource.all[1].onopen?.();
    expect(s.onReconnected).toHaveBeenCalledTimes(1);
    expect(s.statuses.at(-1)).toBe("open");
  });

  it("backs off while the backend stays down", () => {
    start();
    FakeSource.all[0].onerror?.();
    vi.advanceTimersByTime(1000);
    FakeSource.all[1].onerror?.();
    vi.advanceTimersByTime(1999);
    expect(FakeSource.all).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(FakeSource.all).toHaveLength(3);
  });

  it("stops for good", () => {
    const s = start();
    s.stop();
    FakeSource.all[0].onerror?.();
    vi.advanceTimersByTime(10_000);
    expect(FakeSource.all).toHaveLength(1);
    expect(FakeSource.all[0].closed).toBe(true);
  });
});

describe("parseEvent", () => {
  it("accepts only event rows", () => {
    expect(
      parseEvent(
        '{"id":1,"entity":"job","entity_id":"j","type":"created","data":{},"created_at":""}',
      ),
    ).toMatchObject({ id: 1 });
    expect(parseEvent('{"id":"1"}')).toBeNull();
    expect(parseEvent(42)).toBeNull();
  });
});
