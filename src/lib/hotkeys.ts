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

/** A bare-key shortcut (no ⌘/Ctrl) must not fire while the person is typing. */
export function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
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
      if (!combo.includes("mod+") && isTyping(e.target)) return;
      e.preventDefault();
      ref.current(e);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [combo, enabled]);
}
