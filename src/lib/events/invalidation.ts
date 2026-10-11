import type { QueryKey } from "@tanstack/react-query";
import type { ApiEvent } from "@/lib/api/types";

/** The queries an event makes stale. Keys are prefixes: ["candidates"] covers every job's list. */
export function keysFor(e: ApiEvent): QueryKey[] {
  const id = e.entity_id;
  switch (e.entity) {
    case "job":
      if (e.type === "criteria_step") return [];
      if (e.type.startsWith("campaign_")) return [["campaign", id], ["jobs"]];
      if (e.type === "candidates_imported")
        return [
          ["candidates", id],
          ["campaign", id],
        ];
      return [["jobs"], ["job", id], ["criteria", id]];
    case "candidate":
      return [["candidates"], ["candidate", id], ["campaign"]];
    case "call":
      return [
        ["activeCalls"],
        ["calls"],
        ["candidates"],
        ["candidate"],
        ["campaign"],
      ];
    case "decision":
      return [["decisions"], ["decision", id], ["candidates"], ["candidate"]];
    case "message": {
      const decisionId =
        typeof e.data.decision_id === "string" ? e.data.decision_id : null;
      return [
        decisionId ? ["decision", decisionId] : ["decision"],
        ["decisions"],
      ];
    }
    default:
      return [];
  }
}
