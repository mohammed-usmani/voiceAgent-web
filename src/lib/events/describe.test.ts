import { describe, expect, it } from "vitest";
import type { ApiEvent } from "@/lib/api/types";
import { describeEvent } from "./describe";

const ev = (
  entity: ApiEvent["entity"],
  type: string,
  data: Record<string, unknown> = {},
): ApiEvent => ({
  id: 1,
  entity,
  entity_id: "e1",
  type,
  data,
  created_at: "2026-10-10T09:00:00Z",
});

describe("describeEvent", () => {
  it("toasts when criteria are ready and links to the job", () => {
    expect(describeEvent(ev("job", "criteria_ready", { version: 1 }))).toEqual({
      text: "Criteria ready to review",
      tone: "teal",
      href: "/jobs/e1",
      toast: "success",
    });
  });

  it("names the agent's step", () => {
    expect(
      describeEvent(ev("job", "criteria_step", { step: "critique", round: 2 }))
        .text,
    ).toBe("Criteria agent: critique (round 2)");
  });

  it("links call events to the candidate when it is known", () => {
    expect(
      describeEvent(ev("call", "queued", { candidate_id: "c7" })).href,
    ).toBe("/candidates/c7");
    expect(describeEvent(ev("call", "answered")).href).toBeNull();
  });

  it("says how a call ended", () => {
    expect(
      describeEvent(ev("call", "ended", { end_reason: "callback_requested" }))
        .text,
    ).toBe("Call ended: callback requested");
  });

  it("toasts new decisions and failed sends", () => {
    expect(
      describeEvent(ev("decision", "created", { result: "needs_review" })),
    ).toMatchObject({
      text: "Decision: needs review",
      href: "/decisions/e1",
      toast: "info",
    });
    expect(
      describeEvent(ev("message", "send_failed", { decision_id: "d2" })),
    ).toMatchObject({
      tone: "rose",
      href: "/decisions/d2",
      toast: "error",
    });
  });

  it("falls back to plain words for anything new", () => {
    expect(describeEvent(ev("candidate", "renamed"))).toMatchObject({
      text: "Candidate renamed",
      tone: "muted",
      toast: null,
    });
  });
});
