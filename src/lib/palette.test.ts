import { describe, expect, it } from "vitest";
import type { Job } from "@/lib/api/types";
import type { LiveCall } from "@/lib/live/focus";
import { candidate, summary } from "@/test/fixtures";
import { paletteItems } from "./palette";

const job = { id: "j1", title: "Customer Support Associate", company_name: "Brightline Support (demo)" } as Job;
const liveCall = { id: "k1", candidateName: "Vikram Singh", jobTitle: "Customer Support Associate", phase: "live" } as LiveCall;

describe("paletteItems", () => {
  it("lists places, jobs, candidates, decisions to review, live calls and actions", () => {
    const items = paletteItems({
      jobs: [job],
      candidates: [candidate("c1", "pending", { name: "Neha Gupta" })],
      decisions: [summary({ id: "d1", candidate_name: "Ananya Rao" }), summary({ id: "d2", status: "sent" })],
      live: [liveCall, { ...liveCall, id: "k2", phase: "ended" }],
    });
    const byId = Object.fromEntries(items.map((i) => [i.id, i]));
    expect(byId["job:j1"]).toMatchObject({ group: "Jobs", label: "Customer Support Associate", href: "/jobs/j1" });
    expect(byId["candidate:c1"]).toMatchObject({ label: "Neha Gupta", hint: "Customer Support Associate", href: "/candidates/c1" });
    expect(byId["decision:d1"]).toMatchObject({ label: "Ananya Rao: Suitable", href: "/decisions/d1" });
    expect(byId["decision:d2"]).toBeUndefined();
    expect(byId["live:k1"]).toMatchObject({ action: "focus", callId: "k1" });
    expect(byId["live:k2"]).toBeUndefined();
    expect(items.filter((i) => i.group === "Actions").map((i) => i.action)).toEqual(["wall", "rail"]);
    expect(items[0]).toMatchObject({ group: "Go to", href: "/" });
  });
});
