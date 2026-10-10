import { describe, expect, it, vi } from "vitest";
import { EMPTY_LIVE } from "./call-state";
import { createLiveStore } from "./store";

describe("createLiveStore", () => {
  it("keeps one state per call and notifies listeners", () => {
    const store = createLiveStore();
    const listener = vi.fn();
    const stop = store.subscribe(listener);
    store.apply("a", { type: "connected" });
    expect(store.get("a").status).toBe("live");
    expect(store.get("b")).toBe(EMPTY_LIVE);
    const snapshot = store.get("a");
    expect(store.get("a")).toBe(snapshot); // stable until it changes
    store.remove("a");
    expect(store.get("a")).toBe(EMPTY_LIVE);
    expect(listener).toHaveBeenCalledTimes(2);
    stop();
    store.apply("a", { type: "connected" });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("marks only the failing call unavailable", () => {
    const store = createLiveStore();
    store.apply("a", { type: "connected" });
    store.apply("b", { type: "unavailable" });
    expect(store.get("a").status).toBe("live");
    expect(store.get("b").status).toBe("unavailable");
  });
});
