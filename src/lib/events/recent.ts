import type { ApiEvent } from "@/lib/api/types";

export const MAX_RECENT = 200;

/** The activity feed, newest first: live events and loaded history together, each event once. */
export function mergeRecent(
  current: ApiEvent[],
  incoming: ApiEvent[],
): ApiEvent[] {
  const byId = new Map<number, ApiEvent>();
  for (const e of [...current, ...incoming]) byId.set(e.id, e);
  return [...byId.values()].sort((a, b) => b.id - a.id).slice(0, MAX_RECENT);
}
