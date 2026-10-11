import { describe, expect, it } from "vitest";
import type { ApiEvent } from "@/lib/api/types";
import { mergeRecent } from "./recent";

const ev = (id: number): ApiEvent => ({
  id,
  entity: "job",
  entity_id: "j1",
  type: "created",
  data: {},
  created_at: "2026-10-11T10:00:00Z",
});

describe("mergeRecent", () => {
  it("puts history under live events, newest first, each event once", () => {
    const live = [ev(12), ev(11)];
    const history = [ev(9), ev(10), ev(11)]; // the API returns oldest first; 11 also arrived live
    expect(mergeRecent(live, history).map((e) => e.id)).toEqual([
      12, 11, 10, 9,
    ]);
  });

  it("keeps the newest 200", () => {
    const many = Array.from({ length: 250 }, (_, i) => ev(i + 1));
    const merged = mergeRecent([], many);
    expect(merged).toHaveLength(200);
    expect(merged[0].id).toBe(250);
  });
});
