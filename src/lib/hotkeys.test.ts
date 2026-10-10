import { describe, expect, it } from "vitest";
import { matchesHotkey } from "./hotkeys";

const key = (k: string, mods: Partial<Record<"metaKey" | "ctrlKey" | "shiftKey" | "altKey", boolean>> = {}) => ({
  key: k,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  ...mods,
});

describe("matchesHotkey", () => {
  it("treats ⌘ and Ctrl alike for mod", () => {
    expect(matchesHotkey(key("k", { metaKey: true }), "mod+k")).toBe(true);
    expect(matchesHotkey(key("K", { ctrlKey: true }), "mod+k")).toBe(true);
    expect(matchesHotkey(key("k"), "mod+k")).toBe(false);
  });

  it("requires exactly the modifiers named", () => {
    expect(matchesHotkey(key("k", { metaKey: true, shiftKey: true }), "mod+k")).toBe(false);
    expect(matchesHotkey(key(".", { metaKey: true }), "mod+.")).toBe(true);
    expect(matchesHotkey(key("Escape"), "escape")).toBe(true);
    expect(matchesHotkey(key("Escape", { metaKey: true }), "escape")).toBe(false);
  });
});
