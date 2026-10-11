import type { ApiEvent } from "@/lib/api/types";

export type StreamStatus = "connecting" | "open" | "reconnecting";

/** The part of EventSource this module uses (a fake in tests). */
export interface EventSourceLike {
  onopen: (() => void) | null;
  onmessage: ((m: { data: unknown }) => void) | null;
  onerror: (() => void) | null;
  close(): void;
}

export interface StreamOptions {
  url: string;
  onEvent(e: ApiEvent): void;
  onStatus(s: StreamStatus): void;
  /** The stream came back after a drop: refetch anything that may have been missed. */
  onReconnected(): void;
  open?: (url: string) => EventSourceLike;
  delays?: number[];
}

export function parseEvent(raw: unknown): ApiEvent | null {
  if (typeof raw !== "string") return null;
  try {
    const v: unknown = JSON.parse(raw);
    if (
      typeof v === "object" &&
      v !== null &&
      "id" in v &&
      typeof v.id === "number" &&
      "entity" in v &&
      typeof v.entity === "string" &&
      "entity_id" in v &&
      typeof v.entity_id === "string" &&
      "type" in v &&
      typeof v.type === "string" &&
      "data" in v &&
      typeof v.data === "object" &&
      v.data !== null
    ) {
      return v as ApiEvent;
    }
  } catch {
    // a malformed frame is skipped
  }
  return null;
}

/** One EventSource that resumes after the last event id (`?after=`) whenever it drops.
 * Returns a function that closes it for good. */
export function startEventStream(o: StreamOptions): () => void {
  const open =
    o.open ??
    ((url: string) => new EventSource(url) as unknown as EventSourceLike);
  const delays = o.delays ?? [1000, 2000, 5000];
  let lastId: number | null = null;
  let attempt = 0;
  let opened = false;
  let stopped = false;
  let source: EventSourceLike | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const connect = () => {
    if (!opened && attempt === 0) o.onStatus("connecting");
    const s = open(lastId === null ? o.url : `${o.url}?after=${lastId}`);
    source = s;
    s.onopen = () => {
      if (opened) o.onReconnected();
      opened = true;
      attempt = 0;
      o.onStatus("open");
    };
    s.onmessage = (m) => {
      const e = parseEvent(m.data);
      if (!e || (lastId !== null && e.id <= lastId)) return;
      lastId = e.id;
      o.onEvent(e);
    };
    s.onerror = () => {
      s.close(); // we reconnect ourselves, with ?after=
      if (stopped) return;
      o.onStatus("reconnecting");
      timer = setTimeout(connect, delays[Math.min(attempt, delays.length - 1)]);
      attempt += 1;
    };
  };

  connect();
  return () => {
    stopped = true;
    clearTimeout(timer);
    source?.close();
  };
}
