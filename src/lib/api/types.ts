export type Uuid = string;
export type IsoDateTime = string;

/* Jobs and criteria */
export type JobStatus = "generating" | "criteria_ready" | "criteria_failed" | "active" | "closed";
export interface CallingHours {
  start: string; // "HH:MM" in the job's timezone
  end: string;
}
export interface Job {
  id: Uuid;
  title: string;
  company_name: string;
  description: string;
  recruiter_notes: string;
  agent_name: string;
  timezone: string;
  auto_send_invites: boolean;
  response_days: number;
  voice: string;
  calling_hours: CallingHours;
  criteria_stale: boolean;
  status: JobStatus;
  created_at: IsoDateTime;
}
export interface JobCreate {
  title: string;
  company_name: string;
  description: string;
  recruiter_notes?: string;
  agent_name?: string;
  timezone?: string;
  voice?: string;
  calling_hours?: CallingHours;
}

export type RequirementKind = "number" | "boolean" | "choice" | "text";
export type RuleOp = ">=" | "<=" | ">" | "<" | "==" | "in" | "between";
export interface Rule {
  op: RuleOp;
  value: boolean | number | string | number[] | string[];
}
export interface Requirement {
  id: string;
  label: string;
  kind: RequirementKind;
  unit: string | null;
  options: string[] | null;
  question: string;
  hard: boolean;
  rule: Rule | null;
  weight: number;
  rubric: string | null;
  sensitive: boolean;
  disclose: boolean;
  source: string;
}
export interface JobFacts {
  summary: string;
  location: string | null;
  work_mode: string | null;
  interview_process: string | null;
  salary_band: string | null;
  other: string[];
}
export interface Criteria {
  requirements: Requirement[];
  job_facts: JobFacts;
  pass_threshold: number;
}
export type CriteriaStatus = "draft" | "approved" | "superseded";
export interface CriteriaVersion extends Criteria {
  id: Uuid;
  version: number;
  status: CriteriaStatus;
  warnings: string[];
  errors: string[];
  model: string;
  approved_at: IsoDateTime | null;
}

/* Candidates and calls */
export type CandidateStatus =
  | "pending"
  | "calling"
  | "screened"
  | "decided"
  | "notified"
  | "no_answer"
  | "callback"
  | "declined_consent"
  | "withdrawn"
  | "unreachable";
export interface Candidate {
  id: Uuid;
  job_id: Uuid;
  name: string;
  email: string;
  phone: string | null;
  sip_address: string | null;
  resume_text: string;
  status: CandidateStatus;
  excluded_at: IsoDateTime | null; // backend addition 7
  created_at: IsoDateTime;
}
export interface CandidateCreate {
  name: string;
  email: string;
  phone?: string;
  sip_address?: string;
  resume_text?: string;
}
export interface ImportResult {
  created: number;
  errors: { row: number; errors: string[] }[];
}

export type CallStatus =
  | "queued"
  | "ringing"
  | "in_progress"
  | "completed"
  | "no_answer"
  | "voicemail"
  | "failed";
export interface TranscriptTurn {
  role: "agent" | "candidate";
  text: string;
  at: IsoDateTime;
}
export interface Call {
  id: Uuid;
  candidate_id: Uuid;
  criteria_version_id: Uuid;
  room: string;
  attempt: number;
  status: CallStatus;
  end_reason: string | null; // completed · declined_consent · callback_requested · not_interested · candidate_hung_up · voicemail · error
  callback_at: IsoDateTime | null;
  consent_given: boolean | null;
  started_at: IsoDateTime | null;
  ended_at: IsoDateTime | null;
  error: string | null;
  transcript: TranscriptTurn[];
  created_at: IsoDateTime;
}
/** GET /calls?status=in_progress (backend addition 3, Ruling 2). */
export interface ActiveCall extends Call {
  candidate_name: string;
  job_id: Uuid;
  job_title: string;
}
/** POST /calls/{id}/viewer-token (backend addition 2). */
export interface ViewerToken {
  url: string;
  token: string;
  room: string;
}

export type CampaignStatus = "active" | "paused" | "done";
export interface Campaign {
  job_id: Uuid;
  status: CampaignStatus;
  max_concurrent: number;
  started_at: IsoDateTime;
  paused_at: IsoDateTime | null;
  finished_at: IsoDateTime | null;
  in_flight: number;
  candidates: Partial<Record<CandidateStatus, number>>;
}

/* Decisions and messages */
export type DecisionResult = "suitable" | "not_suitable" | "needs_review";
export type FinalResult = "suitable" | "not_suitable";
export type DecisionStatus = "pending_review" | "overridden" | "approved" | "sent";
export interface DecisionSummary {
  id: Uuid;
  job_id: Uuid;
  candidate_id: Uuid;
  candidate_name: string;
  call_id: Uuid;
  result: DecisionResult;
  final_result: FinalResult | null;
  score: number | null;
  status: DecisionStatus;
  summary: string;
  created_at: IsoDateTime;
}
export type Verdict = "pass" | "fail" | "unknown" | "declined" | "scored";
export interface Reason {
  requirement_id: string;
  verdict: Verdict;
  score: number | null;
  quote: string;
  confidence: number;
  note: string;
}
export interface AgentReview {
  agree: boolean;
  notes: string;
  challenged: string;
  model: string;
}
export interface Answer {
  requirement_id: string;
  value: boolean | number | string | null;
  declined: boolean;
  quote: string;
  confidence: number;
  inconsistency: string | null;
}
export type MessageStatus = "draft" | "queued" | "sending" | "sent" | "failed";
export interface Message {
  id: Uuid;
  decision_id: Uuid;
  kind: "invite" | "rejection";
  to: string;
  subject: string;
  body: string;
  status: MessageStatus;
  issues: string[];
  sent_at: IsoDateTime | null;
  error: string | null;
  updated_at: IsoDateTime;
}
export interface Decision extends DecisionSummary {
  criteria_version_id: Uuid;
  hard_failures: string[];
  reasons: Reason[];
  model: string;
  reviewer_note: string | null;
  agent_review: AgentReview | null;
  trace: Record<string, unknown>[];
  answers: Answer[];
  message: Message | null;
}
export interface Override {
  result: FinalResult;
  note: string;
  requirement_ids?: string[] | null;
}

/* Events (backend addition 1) */
export type EventEntity = "job" | "candidate" | "call" | "decision" | "message";
export interface ApiEvent {
  id: number;
  entity: EventEntity;
  entity_id: string;
  type: string;
  data: Record<string, unknown>;
  created_at: IsoDateTime;
}
export type CriteriaStepName = "retrieve" | "draft" | "critique" | "revise" | "finalize";

/* LiveKit data topics (backend addition 4) */
export interface Progress {
  asking: string | null;
  asked: string[];
}
export interface TurnPoint {
  i: number;
  kind: "pause" | "overlap";
  t: number; // seconds since the call started
  outcome: string; // respond · wait · interrupt · ignore · unresolved
  eot_delay_ms: number | null;
  reply_delay_ms: number | null;
  paused_then_resumed: boolean;
  suspect: string | null; // cut_off · slow_response · false_stop · missed_barge_in
}

/* Evaluation (backend addition 6; results.json from evals/report.py + runner.py) */
export type MetricValue = number | boolean | null;
export interface EvalRunSummary {
  name: string;
  started_at: IsoDateTime;
  offline: boolean;
  headline: Record<string, MetricValue>;
  cost_usd: number;
}
export interface EvalPersona {
  key: string;
  kind: string;
  name: string;
  resume: string;
  expected_end: string | null;
  expected_decision: DecisionResult | null;
}
export interface EvalCall {
  job: string;
  persona: EvalPersona;
  run: number;
  call: {
    end_reason: string;
    callback_at: string | null;
    turns: number;
    stopped_by: string | null;
    transcript: TranscriptTurn[];
  } | null;
  assessment: {
    result: DecisionResult;
    score: number | null;
    hard_failures: string[];
    summary: string;
    reasons: Reason[];
  } | null;
  message: { kind: string; subject: string; body: string } | null;
  judgement: { notes: string } | null;
  cost_usd: number;
  error: string | null;
}
export interface EvalComparisonRow {
  metric: string;
  current: MetricValue;
  previous: number | null;
  delta: number | null;
}
export interface EvalResults {
  name: string;
  started_at: IsoDateTime;
  finished_at: IsoDateTime | null;
  config: { jobs: string[]; personas: number; runs: number; budget_usd: number; offline: boolean };
  aborted: string | null;
  summary: Record<string, MetricValue>;
  calls: EvalCall[];
  comparison: { previous: string | null; rows: EvalComparisonRow[] };
  cost: { usd: number; tokens: Record<string, [number, number]> };
}
