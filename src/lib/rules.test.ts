import { describe, expect, it } from "vitest";
import { requirement } from "@/test/fixtures";
import { answerKind, ruleText } from "./rules";

describe("ruleText", () => {
  it("words number rules with their unit", () => {
    expect(ruleText(requirement({ rule: { op: ">=", value: 2 } }))).toBe("At least 2 years");
    expect(ruleText(requirement({ rule: { op: ">=", value: 1 } }))).toBe("At least 1 year");
    expect(ruleText(requirement({ unit: "days", rule: { op: "<=", value: 30 } }))).toBe("At most 30 days");
    expect(ruleText(requirement({ rule: { op: ">", value: 0.5 } }))).toBe("More than 0.5 years");
    expect(ruleText(requirement({ unit: "LPA", rule: { op: "<", value: 6 } }))).toBe("Less than 6 LPA");
    expect(ruleText(requirement({ unit: null, rule: { op: "==", value: 0 } }))).toBe("Exactly 0");
    expect(ruleText(requirement({ rule: { op: "between", value: [1, 3] } }))).toBe("Between 1 and 3 years");
  });

  it("words yes/no and choice rules", () => {
    expect(ruleText(requirement({ kind: "boolean", unit: null, rule: { op: "==", value: true } }))).toBe("Must be yes");
    expect(ruleText(requirement({ kind: "boolean", unit: null, rule: { op: "==", value: false } }))).toBe("Must be no");
    expect(ruleText(requirement({ kind: "choice", unit: null, rule: { op: "in", value: ["Day", "Night", "Rotational"] } }))).toBe("One of Day, Night or Rotational");
    expect(ruleText(requirement({ kind: "choice", unit: null, rule: { op: "==", value: "Night" } }))).toBe("Must be Night");
  });

  it("falls back to the rubric when there is no rule", () => {
    expect(ruleText(requirement({ kind: "text", hard: false, rule: null, rubric: "Stays calm" }))).toBe("Judged on: Stays calm");
    expect(ruleText(requirement({ hard: false, rule: null, rubric: null }))).toBe("Scored, no rule");
  });
});

describe("answerKind", () => {
  it("describes the expected answer", () => {
    expect(answerKind(requirement())).toBe("A number (years)");
    expect(answerKind(requirement({ kind: "boolean" }))).toBe("Yes or no");
    expect(answerKind(requirement({ kind: "choice", options: ["Day", "Night"] }))).toBe("One of: Day, Night");
    expect(answerKind(requirement({ kind: "text" }))).toBe("In their own words");
  });
});
