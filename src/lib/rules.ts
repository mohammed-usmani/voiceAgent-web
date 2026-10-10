import type { Requirement, RuleOp } from "./api/types";

const NUM = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

function qty(n: number, unit: string | null): string {
  const u = unit && n === 1 && unit.endsWith("s") ? unit.slice(0, -1) : unit;
  return u ? `${NUM.format(n)} ${u}` : NUM.format(n);
}

function list(xs: string[]): string {
  return xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} or ${xs.at(-1)}`;
}

export const OP_LABEL: Record<RuleOp, string> = {
  ">=": "at least",
  "<=": "at most",
  ">": "more than",
  "<": "less than",
  "==": "exactly",
  in: "one of",
  between: "between",
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** A rule in plain words: "At least 2 years", "Must be yes", "One of Day or Night". */
export function ruleText(r: Pick<Requirement, "kind" | "unit" | "rule" | "rubric">): string {
  const rule = r.rule;
  if (!rule) return r.rubric ? `Judged on: ${r.rubric}` : "Scored, no rule";
  const v = rule.value;
  if (r.kind === "boolean") return v === true ? "Must be yes" : "Must be no";
  if (rule.op === "between" && Array.isArray(v) && typeof v[0] === "number" && typeof v[1] === "number") {
    return `Between ${NUM.format(v[0])} and ${qty(v[1], r.unit)}`;
  }
  if (rule.op === "in" && Array.isArray(v)) return `One of ${list(v.map(String))}`;
  if (typeof v === "number") return cap(`${OP_LABEL[rule.op]} ${qty(v, r.unit)}`);
  return `Must be ${String(v)}`;
}

export function answerKind(r: Pick<Requirement, "kind" | "unit" | "options">): string {
  switch (r.kind) {
    case "number":
      return r.unit ? `A number (${r.unit})` : "A number";
    case "boolean":
      return "Yes or no";
    case "choice":
      return `One of: ${(r.options ?? []).join(", ")}`;
    case "text":
      return "In their own words";
  }
}
