import type { ViewerToken } from "@/lib/api/types";
import type { LiveMessage } from "./call-state";
import { connectFake } from "./fake";

export type Emit = (m: LiveMessage) => void;

export interface LiveConnection {
  /** Subscribe to the call's audio (the focused call only). */
  focus(on: boolean): void;
  /** Play it (after the recruiter clicks "Listen in"). */
  listen(on: boolean): Promise<void>;
  close(): void;
}

export async function connectLive(token: ViewerToken, emit: Emit): Promise<LiveConnection> {
  if (token.url.startsWith("fake://")) return connectFake(token.room, emit);
  const { connectLiveKit } = await import("./livekit"); // keeps livekit-client out of the first load
  return connectLiveKit(token, emit);
}
