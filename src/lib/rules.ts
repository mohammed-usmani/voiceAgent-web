import type { Requirement, RequirementKind, Rule, RuleOp } from "./api/types";

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

export const OPS_BY_KIND: Record<RequirementKind, RuleOp[]> = {
  number: [">=", "<=", ">", "<", "==", "between"],
  boolean: ["=="],
  choice: ["==", "in"],
  text: [], // judged against a rubric, never by a rule
};

export function parseRuleValue(kind: RequirementKind, op: RuleOp, input: string, options: string[] | null = null): Rule["value"] | null {
  const s = input.trim();
  if (kind === "number") {
    if (op === "between") {
      const parts = s.split(/\s*(?:-|–|,|\bto\b|\band\b)\s*/).filter(Boolean).map(Number);
      return parts.length === 2 && parts.every(Number.isFinite) && parts[0] <= parts[1] ? parts : null;
    }
    const n = Number(s);
    return s !== "" && Number.isFinite(n) ? n : null;
  }
  if (kind === "boolean") {
    if (/^(yes|true)$/i.test(s)) return true;
    if (/^(no|false)$/i.test(s)) return false;
    return null;
  }
  if (kind === "choice") {
    const pick = (x: string) => options?.find((o) => o.toLowerCase() === x.trim().toLowerCase()) ?? null;
    if (op === "in") {
      const picked = s.split(",").map(pick);
      return picked.length > 0 && picked.every((x): x is string => x !== null) ? picked : null;
    }
    return pick(s);
  }
  return null;
}

export function ruleValueInput(rule: Rule): string {
  const v = rule.value;
  if (Array.isArray(v)) return rule.op === "between" ? v.join("-") : v.join(", ");
  if (typeof v === "boolean") return v ? "yes" : "no";
  return String(v);
}

export function ruleInputHint(kind: RequirementKind, op: RuleOp): string {
  if (kind === "number") return op === "between" ? "Two numbers, like 1-3" : "A number";
  if (kind === "boolean") return "yes or no";
  if (kind === "choice") return op === "in" ? "Options separated by commas" : "One of the options";
  return "Free-text answers have no rule";
}
