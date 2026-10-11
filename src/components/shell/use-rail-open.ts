"use client";

import { useCallback, useState, useSyncExternalStore } from "react";

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

const XL = "(min-width: 1280px)"; // Tailwind's xl: the rail takes layout space from here up

function subscribeWidth(l: () => void) {
  const mq = window.matchMedia(XL);
  mq.addEventListener("change", l);
  return () => mq.removeEventListener("change", l);
}

/**
 * [open, setOpen, overlay]. From xl up the rail is a column whose state is remembered;
 * below xl it is a drawer over the content that starts closed and isn't remembered.
 */
export function useRailOpen(): [boolean, (open: boolean) => void, boolean] {
  const wide = useSyncExternalStore(subscribeWidth, () => window.matchMedia(XL).matches, () => true);
  const [drawer, setDrawer] = useState(false);
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
  return wide ? [open, set, false] : [drawer, setDrawer, true];
}
