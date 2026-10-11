import { describe, expect, it } from "vitest";
import type { ApiEvent } from "@/lib/api/types";
import { keysFor } from "./invalidation";

const ev = (
  entity: ApiEvent["entity"],
  type: string,
  data: Record<string, unknown> = {},
): ApiEvent => ({
  id: 1,
  entity,
  entity_id: "x1",
  type,
  data,
  created_at: "2026-10-10T09:00:00Z",
});

describe("keysFor", () => {
  it("refreshes the job, its criteria and the jobs list on criteria events", () => {
    expect(keysFor(ev("job", "criteria_ready"))).toEqual([
      ["jobs"],
      ["job", "x1"],
      ["criteria", "x1"],
    ]);
  });

  it("ignores criteria steps (the timeline reads them from the event buffer)", () => {
    expect(keysFor(ev("job", "criteria_step", { step: "draft" }))).toEqual([]);
  });

  it("refreshes the campaign on campaign events and the candidates on an import", () => {
    expect(keysFor(ev("job", "campaign_paused"))).toEqual([
      ["campaign", "x1"],
      ["jobs"],
    ]);
    expect(keysFor(ev("job", "candidates_imported"))).toEqual([
      ["candidates", "x1"],
      ["campaign", "x1"],
    ]);
  });

  it("refreshes live calls, candidates and campaigns on call events", () => {
    expect(keysFor(ev("call", "answered"))).toEqual([
      ["activeCalls"],
      ["calls"],
      ["candidates"],
      ["candidate"],
      ["campaign"],
    ]);
  });

  it("refreshes the queue, the decision and candidates on decision events", () => {
    expect(keysFor(ev("decision", "created"))).toEqual([
      ["decisions"],
      ["decision", "x1"],
      ["candidates"],
      ["candidate"],
    ]);
  });

  it("refreshes the message's decision when the event names it", () => {
    expect(keysFor(ev("message", "sent", { decision_id: "d9" }))).toEqual([
      ["decision", "d9"],
      ["decisions"],
    ]);
    expect(keysFor(ev("message", "edited"))).toEqual([
      ["decision"],
      ["decisions"],
    ]);
  });

  it("refreshes candidate lists on candidate events", () => {
    expect(keysFor(ev("candidate", "excluded"))).toEqual([
      ["candidates"],
      ["candidate", "x1"],
      ["campaign"],
    ]);
  });
});
