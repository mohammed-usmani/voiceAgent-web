import type { Call, Candidate, DecisionSummary, Requirement } from "@/lib/api/types";

export const summary = (over: Partial<DecisionSummary> = {}): DecisionSummary => ({
  id: "d1",
  job_id: "j1",
  candidate_id: "c1",
  candidate_name: "Ananya Rao",
  call_id: "call1",
  result: "suitable",
  final_result: null,
  score: 0.9,
  status: "pending_review",
  summary: "",
  created_at: "2026-10-10T08:00:00Z",
  ...over,
});

export const candidate = (id: string, status: Candidate["status"], over: Partial<Candidate> = {}): Candidate => ({
  id,
  job_id: "j1",
  name: id,
  email: `${id}@example.com`,
  phone: "+919876543210",
  sip_address: null,
  resume_text: "",
  status,
  excluded_at: null,
  created_at: "2026-10-01T08:00:00Z",
  ...over,
});

export const call = (over: Partial<Call> = {}): Call => ({
  id: "call1",
  candidate_id: "c1",
  criteria_version_id: "cv1",
  room: "screen-abc",
  attempt: 1,
  status: "completed",
  end_reason: "completed",
  callback_at: null,
  consent_given: true,
  started_at: "2026-10-10T08:00:00Z",
  ended_at: "2026-10-10T08:06:00Z",
  error: null,
  transcript: [],
  created_at: "2026-10-10T07:59:00Z",
  ...over,
});

export const requirement = (over: Partial<Requirement> = {}): Requirement => ({
  id: "intl_voice_years",
  label: "International voice experience",
  kind: "number",
  unit: "years",
  options: null,
  question: "How many years have you worked in an international voice process?",
  hard: true,
  rule: { op: ">=", value: 1 },
  weight: 0,
  rubric: null,
  sensitive: false,
  disclose: false,
  source: "at least 1 year of international voice process experience",
  ...over,
});
