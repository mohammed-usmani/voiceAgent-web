import { describe, expect, it } from "vitest";
import type { ApiEvent } from "@/lib/api/types";
import { criteriaSteps, findQuote, highlightSegments, parseWarnings, summaryText } from "./criteria";

const text = "You need at least 1 year of\n  international voice process experience. Night shifts (US hours).";

describe("findQuote", () => {
  it("finds a quote across line breaks, case and curly quotes", () => {
    const range = findQuote(text, "At least 1 year of international voice process experience");
    expect(range).not.toBeNull();
    const [a, b] = range ?? [0, 0];
    expect(text.slice(a, b)).toBe("at least 1 year of\n  international voice process experience");
    expect(findQuote("the candidate’s notice", "candidate's notice")).toEqual([4, 22]);
  });

  it("returns null when the quote isn't there", () => {
    expect(findQuote(text, "five years of Java")).toBeNull();
    expect(findQuote(text, "  ")).toBeNull();
  });
});

describe("highlightSegments", () => {
  it("splits text at every span edge and tags overlapping spans", () => {
    const segments = highlightSegments("abcdefgh", [
      { id: "x", range: [1, 5] },
      { id: "y", range: [3, 7] },
    ]);
    expect(segments).toEqual([
      { text: "a", ids: [] },
      { text: "bc", ids: ["x"] },
      { text: "de", ids: ["x", "y"] },
      { text: "fg", ids: ["y"] },
      { text: "h", ids: [] },
    ]);
  });

  it("keeps plain text whole without spans", () => {
    expect(highlightSegments("plain", [])).toEqual([{ text: "plain", ids: [] }]);
  });
});

describe("parseWarnings", () => {
  it("separates lines the agent removed from other warnings", () => {
    expect(
      parseWarnings([
        "age_limit: removed (illegal: screens on age, a protected characteristic)",
        "salary: weight 0, so it won't affect the score",
        "Similar roles also screened for: CRM tools",
      ]),
    ).toEqual({
      removed: [{ id: "age_limit", kind: "illegal", detail: "screens on age, a protected characteristic" }],
      other: ["salary: weight 0, so it won't affect the score", "Similar roles also screened for: CRM tools"],
    });
  });
});

const ev = (id: number, type: string, data: Record<string, unknown> = {}, entityId = "j1"): ApiEvent => ({
  id,
  entity: "job",
  entity_id: entityId,
  type,
  data,
  created_at: "2026-10-10T09:00:00Z",
});

describe("criteriaSteps", () => {
  it("lists this job's steps since generation last started, oldest first", () => {
    const newestFirst = [
      ev(9, "criteria_step", { step: "finalize", round: 2, summary: "5 kept" }),
      ev(8, "criteria_step", { step: "critique", round: 2, summary: { issues: 0 } }),
      ev(7, "criteria_step", { step: "bogus" }),
      ev(6, "criteria_step", { step: "draft", round: 1 }, "other-job"),
      ev(5, "criteria_regenerating"),
      ev(4, "criteria_step", { step: "finalize", round: 1 }),
    ];
    expect(criteriaSteps(newestFirst, "j1").map((s) => [s.step, s.round, s.summary])).toEqual([
      ["critique", 2, "issues 0"],
      ["finalize", 2, "5 kept"],
    ]);
  });
});

describe("summaryText", () => {
  it("prints strings as they are and objects as counts", () => {
    expect(summaryText("6 requirements")).toBe("6 requirements");
    expect(summaryText({ requirements: 6, warnings: ["a", "b"], note: null })).toBe("requirements 6 · warnings 2");
    expect(summaryText(undefined)).toBe("");
    expect(summaryText({ issues: 3, kinds: { illegal: 1, ungrounded: 2 } })).toBe("issues 3 · illegal 1, ungrounded 2");
    expect(summaryText({ issues: 0, kinds: {} })).toBe("issues 0");
  });
});
