import { describe, expect, it } from "vitest";
import { requirement } from "@/test/fixtures";
import { answerKind, parseRuleValue, ruleInputHint, ruleText, ruleValueInput } from "./rules";

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

describe("parseRuleValue", () => {
  it("reads numbers and ranges", () => {
    expect(parseRuleValue("number", ">=", " 2 ")).toBe(2);
    expect(parseRuleValue("number", ">=", "two")).toBeNull();
    expect(parseRuleValue("number", ">=", "")).toBeNull();
    expect(parseRuleValue("number", "between", "1-3")).toEqual([1, 3]);
    expect(parseRuleValue("number", "between", "1 to 3")).toEqual([1, 3]);
    expect(parseRuleValue("number", "between", "3-1")).toBeNull();
  });

  it("reads yes and no", () => {
    expect(parseRuleValue("boolean", "==", "Yes")).toBe(true);
    expect(parseRuleValue("boolean", "==", "false")).toBe(false);
    expect(parseRuleValue("boolean", "==", "maybe")).toBeNull();
  });

  it("only accepts a choice's own options, in their spelling", () => {
    const options = ["Day", "Night", "Rotational"];
    expect(parseRuleValue("choice", "==", "night", options)).toBe("Night");
    expect(parseRuleValue("choice", "in", "day, rotational", options)).toEqual(["Day", "Rotational"]);
    expect(parseRuleValue("choice", "in", "day, evening", options)).toBeNull();
  });

  it("never gives a free-text answer a rule", () => {
    expect(parseRuleValue("text", "==", "anything")).toBeNull();
  });
});

describe("ruleValueInput", () => {
  it("round-trips through parseRuleValue", () => {
    expect(ruleValueInput({ op: "between", value: [1, 3] })).toBe("1-3");
    expect(ruleValueInput({ op: "in", value: ["Day", "Night"] })).toBe("Day, Night");
    expect(ruleValueInput({ op: "==", value: true })).toBe("yes");
    expect(ruleValueInput({ op: ">=", value: 2 })).toBe("2");
  });
});

describe("ruleInputHint", () => {
  it("says what to type", () => {
    expect(ruleInputHint("number", "between")).toBe("Two numbers, like 1-3");
    expect(ruleInputHint("choice", "in")).toBe("Options separated by commas");
  });
});
