import type { Candidate, DecisionSummary, Job } from "./api/types";
import { finalResult, RESULT_LABEL } from "./decisions";
import type { LiveCall } from "./live/focus";

export interface PaletteItem {
  id: string;
  group: "Go to" | "Live calls" | "Jobs" | "Candidates" | "Decisions to review" | "Actions";
  label: string;
  hint?: string;
  href?: string;
  action?: "wall" | "rail" | "focus";
  callId?: string;
}

export function paletteItems(input: { jobs: Job[]; candidates: Candidate[]; decisions: DecisionSummary[]; live: LiveCall[] }): PaletteItem[] {
  const title = new Map(input.jobs.map((j) => [j.id, j.title]));
  return [
    { id: "go:overview", group: "Go to", label: "Overview", href: "/" },
    { id: "go:new-job", group: "Go to", label: "New job", href: "/jobs/new" },
    { id: "go:decisions", group: "Go to", label: "Decisions", href: "/decisions" },
    { id: "go:evaluation", group: "Go to", label: "Evaluation", href: "/evaluation" },
    ...input.live.filter((c) => c.phase === "live").map((c): PaletteItem => ({ id: `live:${c.id}`, group: "Live calls", label: c.candidateName, hint: c.jobTitle, action: "focus", callId: c.id })),
    ...input.jobs.map((j): PaletteItem => ({ id: `job:${j.id}`, group: "Jobs", label: j.title, hint: j.company_name, href: `/jobs/${j.id}` })),
    ...input.candidates.map((c): PaletteItem => ({ id: `candidate:${c.id}`, group: "Candidates", label: c.name, hint: title.get(c.job_id), href: `/candidates/${c.id}` })),
    ...input.decisions
      .filter((d) => d.status === "pending_review")
      .map((d): PaletteItem => ({ id: `decision:${d.id}`, group: "Decisions to review", label: `${d.candidate_name}: ${RESULT_LABEL[finalResult(d)]}`, hint: title.get(d.job_id), href: `/decisions/${d.id}` })),
    { id: "action:wall", group: "Actions", label: "Open the live wall", hint: "⌘J", action: "wall" },
    { id: "action:rail", group: "Actions", label: "Show or hide activity", hint: "⌘.", action: "rail" },
  ];
}
