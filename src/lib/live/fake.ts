import type { LiveMessage } from "./call-state";
import type { Emit, LiveConnection } from "./connect";

/** End-to-end tests drive a "call" by dispatching this event on window (Ruling 16). */
export const FAKE_LIVE_EVENT = "fake-live";
export interface FakeLiveDetail {
  room: string;
  message: LiveMessage;
}

export function connectFake(room: string, emit: Emit): LiveConnection {
  const onEvent = (e: Event) => {
    const detail = (e as CustomEvent<FakeLiveDetail>).detail;
    if (detail?.room === room) emit(detail.message);
  };
  window.addEventListener(FAKE_LIVE_EVENT, onEvent);
  queueMicrotask(() => emit({ type: "connected" }));
  return {
    focus() {},
    async listen(on) {
      emit({ type: "audio", state: on ? "playing" : "off" });
    },
    close() {
      window.removeEventListener(FAKE_LIVE_EVENT, onEvent);
    },
  };
}
