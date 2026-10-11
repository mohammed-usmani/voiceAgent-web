import type { ApiEvent } from "@/lib/api/types";
import { humanize } from "@/lib/format";
import type { Tone } from "@/lib/status";

export interface EventView {
  text: string;
  tone: Tone;
  href: string | null;
  toast: "success" | "info" | "warning" | "error" | null;
}

const str = (v: unknown): string =>
  typeof v === "string" || typeof v === "number" ? String(v) : "";
const words = (v: unknown): string => humanize(str(v)).toLowerCase();

function hrefOf(e: ApiEvent): string | null {
  switch (e.entity) {
    case "job":
      return `/jobs/${e.entity_id}`;
    case "candidate":
      return e.type === "deleted" ? null : `/candidates/${e.entity_id}`;
    case "call":
      return str(e.data.candidate_id)
        ? `/candidates/${str(e.data.candidate_id)}`
        : null;
    case "decision":
      return `/decisions/${e.entity_id}`;
    case "message":
      return str(e.data.decision_id)
        ? `/decisions/${str(e.data.decision_id)}`
        : null;
  }
}

type ViewParts = Pick<EventView, "text"> &
  Partial<Pick<EventView, "tone" | "toast">>;

function view(e: ApiEvent): ViewParts | null {
  const d = e.data;
  switch (`${e.entity}/${e.type}`) {
    case "job/created":
      return { text: `Job created: ${str(d.title)}` };
    case "job/criteria_step":
      return {
        text: `Criteria agent: ${str(d.step)}${Number(d.round) > 1 ? ` (round ${str(d.round)})` : ""}`,
      };
    case "job/criteria_ready":
      return {
        text: "Criteria ready to review",
        tone: "teal",
        toast: "success",
      };
    case "job/criteria_failed":
      return {
        text: "Criteria generation failed",
        tone: "rose",
        toast: "error",
      };
    case "job/criteria_approved":
      return { text: `Criteria v${str(d.version)} approved`, tone: "teal" };
    case "job/criteria_edited":
      return { text: `Criteria edited (draft v${str(d.version)})` };
    case "job/criteria_regenerating":
      return { text: "Regenerating criteria", tone: "amber" };
    case "job/criteria_stale":
      return {
        text: "Criteria out of date with the description",
        tone: "amber",
      };
    case "job/campaign_started":
      return {
        text: `Campaign started (${str(d.max_concurrent)} at once)`,
        tone: "teal",
      };
    case "job/campaign_paused":
      return { text: "Campaign paused", tone: "amber" };
    case "job/campaign_done":
      return { text: "Campaign finished", tone: "teal", toast: "info" };
    case "job/candidates_imported":
      return { text: `${str(d.created)} candidates imported` };
    case "candidate/created":
      return { text: "Candidate added" };
    case "candidate/deleted":
      return { text: "Candidate deleted" };
    case "candidate/unreachable":
      return {
        text: `Unreachable after ${str(d.unanswered_calls)} calls`,
        tone: "rose",
      };
    case "candidate/excluded":
      return { text: "Calling stopped", tone: "amber" };
    case "candidate/included":
      return { text: "Calling resumed" };
    case "call/queued":
      return { text: "Call queued" };
    case "call/ringing":
      return { text: "Ringing", tone: "amber" };
    case "call/answered":
      return { text: "Call answered", tone: "teal" };
    case "call/in_progress":
      return { text: "On call", tone: "teal" };
    case "call/ended":
      return { text: `Call ended: ${words(d.end_reason)}` };
    case "call/not_assessed":
      return { text: `Not assessed: ${words(d.end_reason)}`, tone: "amber" };
    case "call/no_answer":
      return { text: "No answer" };
    case "call/voicemail":
      return { text: "Voicemail: hung up without a message" };
    case "call/failed":
      return { text: "Call failed", tone: "rose" };
    case "decision/created":
      return {
        text: `Decision: ${words(d.result)}`,
        tone: "teal",
        toast: "info",
      };
    case "decision/approved":
      return { text: "Decision approved, sending", tone: "teal" };
    case "decision/overridden":
      return {
        text: `Overridden: ${words(d.from)} → ${words(d.to)}`,
        tone: "amber",
      };
    case "decision/message_failed":
      return {
        text: "Couldn't draft the message",
        tone: "rose",
        toast: "error",
      };
    case "message/drafted":
      return { text: "Message drafted" };
    case "message/queued":
      return { text: "Message queued" };
    case "message/sent":
      return { text: "Message sent", tone: "teal", toast: "success" };
    case "message/send_failed":
      return { text: "Sending failed", tone: "rose", toast: "error" };
    case "message/held":
      return {
        text: "Message held for review",
        tone: "amber",
        toast: "warning",
      };
    case "message/edited":
      return { text: "Message edited" };
    default:
      return null;
  }
}

export function describeEvent(e: ApiEvent): EventView {
  const v = view(e) ?? { text: `${humanize(e.entity)} ${words(e.type)}` };
  return {
    text: v.text,
    tone: v.tone ?? "muted",
    href: hrefOf(e),
    toast: v.toast ?? null,
  };
}
