import { applyLive, EMPTY_LIVE, type LiveCallState, type LiveMessage } from "./call-state";

/** Per-call live state outside React (captions arrive word by word; only the call's own
 * components re-render, through useSyncExternalStore). */
export function createLiveStore() {
  const states = new Map<string, LiveCallState>();
  const listeners = new Set<() => void>();
  const notify = () => {
    for (const l of listeners) l();
  };
  return {
    get: (id: string): LiveCallState => states.get(id) ?? EMPTY_LIVE,
    apply(id: string, m: LiveMessage) {
      states.set(id, applyLive(states.get(id) ?? EMPTY_LIVE, m));
      notify();
    },
    remove(id: string) {
      if (states.delete(id)) notify();
    },
    subscribe(l: () => void) {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
  };
}

export type LiveStore = ReturnType<typeof createLiveStore>;
