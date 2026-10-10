"use client";

import { createContext, type Dispatch, type ReactNode, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from "react";
import { api } from "@/lib/api/client";
import { useActiveCalls } from "@/lib/api/queries";
import type { DecisionResult, ViewerToken } from "@/lib/api/types";
import { useEventListener } from "@/lib/events/provider";
import { EMPTY_LIVE, type LiveCallState } from "./call-state";
import { connectLive, type LiveConnection } from "./connect";
import { type FocusAction, type FocusState, focusReducer, initialFocus, type LiveCall, RESULT_CARD_MS } from "./focus";
import { createLiveStore, type LiveStore } from "./store";

const UNANSWERED = new Set(["no_answer", "voicemail", "failed"]);
const RESULTS = new Set<string>(["suitable", "not_suitable", "needs_review"]);

interface LiveCallsValue {
  state: FocusState;
  dispatch: Dispatch<FocusAction>;
  store: LiveStore;
  listen(callId: string, on: boolean): void;
}
const LiveCallsContext = createContext<LiveCallsValue | null>(null);

/** One hidden LiveKit connection per live call; its messages go to the store. */
function Connector({ call, focused, connections, store }: { call: LiveCall; focused: boolean; connections: Map<string, LiveConnection>; store: LiveStore }) {
  const focusedRef = useRef(focused);
  useEffect(() => {
    focusedRef.current = focused;
    connections.get(call.id)?.focus(focused);
  }, [focused, call.id, connections]);

  useEffect(() => {
    let cancelled = false;
    let conn: LiveConnection | null = null;
    api<ViewerToken>(`/calls/${call.id}/viewer-token`, { method: "POST" })
      .then((token) => connectLive(token, (m) => store.apply(call.id, m)))
      .then((c) => {
        if (cancelled) return c.close();
        conn = c;
        connections.set(call.id, c);
        c.focus(focusedRef.current);
      })
      .catch(() => {
        if (!cancelled) store.apply(call.id, { type: "unavailable" });
      });
    return () => {
      cancelled = true;
      conn?.close();
      connections.delete(call.id);
    };
  }, [call.id, connections, store]);
  return null;
}

export function LiveCallsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(focusReducer, initialFocus);
  const [store] = useState(createLiveStore);
  const [connections] = useState(() => new Map<string, LiveConnection>());
  const active = useActiveCalls();

  useEffect(() => {
    if (active.data) dispatch({ type: "sync", calls: active.data, now: Date.now() });
  }, [active.data]);

  useEventListener((e) => {
    if (e.entity === "call") {
      const reason = typeof e.data.end_reason === "string" ? e.data.end_reason : null;
      if (e.type === "ended") dispatch({ type: "ended", callId: e.entity_id, reason, now: Date.now() });
      else if (UNANSWERED.has(e.type)) dispatch({ type: "ended", callId: e.entity_id, reason: e.type, now: Date.now() });
      else if (e.type === "not_assessed") dispatch({ type: "notAssessed", callId: e.entity_id });
    } else if (e.entity === "decision" && e.type === "created") {
      const { call_id: callId, result } = e.data;
      if (typeof callId === "string" && typeof result === "string" && RESULTS.has(result)) {
        dispatch({ type: "decided", callId, decisionId: e.entity_id, result: result as DecisionResult });
      }
    }
  });

  // The focused call's result card stays ~5 s, then focus moves on (if another call is live).
  const focused = state.focusedId ? state.calls[state.focusedId] : undefined;
  const endedFocusId = focused?.phase === "ended" ? focused.id : null;
  useEffect(() => {
    if (!endedFocusId) return;
    const t = setTimeout(() => dispatch({ type: "advance", callId: endedFocusId }), RESULT_CARD_MS);
    return () => clearTimeout(t);
  }, [endedFocusId]);

  // Forget the live state of calls no longer shown (each Connector closes its own room).
  const shownIds = useMemo(() => new Set(state.order), [state.order]);
  const prevIds = useRef<Set<string>>(new Set());
  useEffect(() => {
    for (const id of prevIds.current) if (!shownIds.has(id)) store.remove(id);
    prevIds.current = shownIds;
  }, [shownIds, store]);

  const listen = useCallback((callId: string, on: boolean) => void connections.get(callId)?.listen(on), [connections]);
  const value = useMemo(() => ({ state, dispatch, store, listen }), [state, store, listen]);
  const liveCalls = state.order.map((id) => state.calls[id]).filter((c) => c?.phase === "live");

  return (
    <LiveCallsContext.Provider value={value}>
      {liveCalls.map((c) => <Connector key={c.id} call={c} focused={c.id === state.focusedId} connections={connections} store={store} />)}
      {children}
    </LiveCallsContext.Provider>
  );
}

export function useLiveCalls(): LiveCallsValue {
  const v = useContext(LiveCallsContext);
  if (!v) throw new Error("useLiveCalls needs <LiveCallsProvider>");
  return v;
}

export function useLiveCall(callId: string): LiveCallState {
  const { store } = useLiveCalls();
  return useSyncExternalStore(store.subscribe, () => store.get(callId), () => EMPTY_LIVE);
}
