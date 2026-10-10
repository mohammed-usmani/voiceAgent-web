"use client";

import { useCallback, useSyncExternalStore } from "react";

const KEY = "activity-rail-open";
const listeners = new Set<() => void>();
let memory: boolean | null = null; // used when storage is unavailable (private windows)

function read(): boolean {
  if (memory !== null) return memory;
  try {
    const saved = localStorage.getItem(KEY);
    if (saved !== null) return saved === "1";
  } catch {
    // storage blocked: fall through to the default
  }
  return window.innerWidth >= 1440; // narrow screens start with the rail closed
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useRailOpen(): [boolean, (open: boolean) => void] {
  const open = useSyncExternalStore(subscribe, read, () => true);
  const set = useCallback((value: boolean) => {
    memory = value;
    try {
      localStorage.setItem(KEY, value ? "1" : "0");
    } catch {
      // kept in memory only
    }
    for (const l of listeners) l();
  }, []);
  return [open, set];
}
