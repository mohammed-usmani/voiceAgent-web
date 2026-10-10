"use client";

import { useEffect, useState } from "react";
import { formatDuration } from "./format";

/** The current time, refreshed every `intervalMs`. */
export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function useElapsed(startedAtMs: number): string {
  return formatDuration(useNow(1000) - startedAtMs);
}
