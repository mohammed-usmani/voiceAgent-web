"use client";

import { useEffect, useRef } from "react";

type KeyLike = Pick<KeyboardEvent, "key" | "metaKey" | "ctrlKey" | "shiftKey" | "altKey">;

/** `combo` is "+"-separated, lower case: "mod+k", "mod+.", "escape". `mod` is ⌘ or Ctrl. */
export function matchesHotkey(e: KeyLike, combo: string): boolean {
  const parts = combo.toLowerCase().split("+");
  const key = parts.at(-1);
  const mods = new Set(parts.slice(0, -1));
  if (mods.has("mod") !== (e.metaKey || e.ctrlKey)) return false;
  if (mods.has("shift") !== e.shiftKey || mods.has("alt") !== e.altKey) return false;
  return e.key.toLowerCase() === key;
}

export function useHotkey(combo: string, handler: (e: KeyboardEvent) => void, enabled = true): void {
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (!matchesHotkey(e, combo)) return;
      e.preventDefault();
      ref.current(e);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [combo, enabled]);
}
