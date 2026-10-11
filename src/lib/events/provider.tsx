"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { api } from "@/lib/api/client";
import type { ApiEvent } from "@/lib/api/types";
import { keysFor } from "./invalidation";
import { mergeRecent } from "./recent";
import { startEventStream, type StreamStatus } from "./stream";

type Listener = (e: ApiEvent) => void;
interface EventsValue {
  status: StreamStatus;
  recent: ApiEvent[];
  subscribe(listener: Listener): () => void;
}

// How much history the activity feed opens with; the stream itself starts at the newest event.
const HISTORY = 50;
const EventsContext = createContext<EventsValue | null>(null);

export function EventsProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<StreamStatus>("connecting");
  const [recent, setRecent] = useState<ApiEvent[]>([]);
  const listeners = useRef(new Set<Listener>());

  useEffect(
    () =>
      startEventStream({
        url: "/api/events/stream",
        onStatus: setStatus,
        onReconnected: () => void qc.invalidateQueries(),
        onEvent: (e) => {
          for (const queryKey of keysFor(e))
            void qc.invalidateQueries({ queryKey });
          setRecent((r) => mergeRecent(r, [e]));
          for (const l of listeners.current) l(e);
        },
      }),
    [qc],
  );

  useEffect(() => {
    // History goes into the feed only: it never fires toasts or listeners.
    api<ApiEvent[]>(`/events?last=${HISTORY}`)
      .then((history) => setRecent((r) => mergeRecent(r, history)))
      .catch(() => {});
  }, []);

  const subscribe = useCallback((l: Listener) => {
    listeners.current.add(l);
    return () => {
      listeners.current.delete(l);
    };
  }, []);
  const value = useMemo(
    () => ({ status, recent, subscribe }),
    [status, recent, subscribe],
  );
  return (
    <EventsContext.Provider value={value}>{children}</EventsContext.Provider>
  );
}

export function useEvents(): EventsValue {
  const v = useContext(EventsContext);
  if (!v) throw new Error("useEvents needs <EventsProvider>");
  return v;
}

/** Calls `listener` for every event from now on (the latest listener, without resubscribing). */
export function useEventListener(listener: Listener): void {
  const { subscribe } = useEvents();
  const ref = useRef(listener);
  useEffect(() => {
    ref.current = listener;
  });
  useEffect(() => subscribe((e) => ref.current(e)), [subscribe]);
}
