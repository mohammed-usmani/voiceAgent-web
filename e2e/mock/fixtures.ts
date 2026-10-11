import type {
  ApiEvent,
  Call,
  Campaign,
  Candidate,
  CriteriaVersion,
  Decision,
  EvalCall,
  EvalResults,
  EvalRunSummary,
  Job,
  Message,
  Requirement,
  TranscriptTurn,
} from "../../src/lib/api/types";

export type StoredCampaign = Omit<Campaign, "in_flight" | "candidates">;
export interface MockState {
  lastEventId: number;
  events: ApiEvent[];
  jobs: Job[];
  criteria: Record<string, CriteriaVersion>; // latest version per job
  approved: Record<string, CriteriaVersion>;
  candidates: Candidate[];
  calls: Call[];
  campaigns: Record<string, StoredCampaign>;
  decisions: Decision[];
  refuseViewerFor: Set<string>; // candidate ids
  evalRuns: { summary: EvalRunSummary; results: EvalResults }[];
}

/** Browser clock in the tests: 15:00 in Kolkata, inside calling hours. */
export const NOW = "2026-10-10T09:30:00Z";

export const SUPPORT_DESCRIPTION =
  "Brightline Support is hiring Customer Support Associates for its US voice process. You need at least 1 year of international voice process experience and a graduate degree. The role works night shifts (US hours) from our Pune office. We'd like you to join within 30 days. Salary up to 4.2 LPA.";

const req = (over: Partial<Requirement> & Pick<Requirement, "id" | "label" | "source">): Requirement => ({
  kind: "boolean",
  unit: null,
  options: null,
  question: `${over.label}?`,
  hard: false,
  rule: null,
  weight: 0,
  rubric: null,
  sensitive: false,
  disclose: false,
  ...over,
});

export const SUPPORT_REQUIREMENTS: Requirement[] = [
  req({ id: "intl_voice_years", label: "International voice experience", kind: "number", unit: "years", hard: true, rule: { op: ">=", value: 1 }, question: "How many years have you worked in an international voice process?", source: "at least 1 year of international voice process experience" }),
  req({ id: "graduate", label: "Graduate degree", hard: true, rule: { op: "==", value: true }, question: "Do you have a graduate degree?", source: "a graduate degree" }),
  req({ id: "night_shifts", label: "Night shifts", hard: true, rule: { op: "==", value: true }, question: "Are you comfortable working night shifts in US hours?", source: "The role works night shifts (US hours)" }),
  req({ id: "joining_days", label: "Joining time", kind: "number", unit: "days", weight: 0.5, rubric: "Sooner is better; 30 days or less is ideal", question: "How soon could you join?", source: "join within 30 days" }),
  req({ id: "frustrated_customer", label: "Handling an upset customer", kind: "text", weight: 0.5, rubric: "Listens, apologises, restates the issue and resolves or escalates", question: "Tell me about a time you handled an upset customer.", source: "US voice process" }),
];

const FACTS = { summary: "Customer support for US customers, night shifts", location: "Pune", work_mode: "Office", interview_process: "Two rounds", salary_band: "Up to 4.2 LPA", other: [] };

const criteria = (id: string, status: CriteriaVersion["status"], requirements: Requirement[], warnings: string[] = []): CriteriaVersion => ({
  id,
  version: 1,
  status,
  requirements,
  job_facts: FACTS,
  pass_threshold: 0.6,
  warnings,
  errors: [],
  model: "criteria agent (fake)",
  approved_at: status === "approved" ? "2026-10-09T10:00:00Z" : null,
});

/** What /__test/criteria "generates" for a new job (its sources are in SUPPORT_DESCRIPTION). */
export function generatedCriteria(): CriteriaVersion {
  return criteria(`cv-${Math.random().toString(36).slice(2, 8)}`, "draft", SUPPORT_REQUIREMENTS.slice(0, 4), [
    "age_limit: removed (illegal: screens on age, a protected characteristic)",
    "Similar roles also screened for: CRM tools",
  ]);
}

const job = (over: Partial<Job> & Pick<Job, "id" | "title" | "company_name" | "status">): Job => ({
  description: SUPPORT_DESCRIPTION,
  recruiter_notes: "",
  agent_name: "Aria",
  timezone: "Asia/Kolkata",
  auto_send_invites: false,
  response_days: 3,
  voice: "default",
  calling_hours: { start: "10:00", end: "19:00" },
  criteria_stale: false,
  created_at: "2026-10-09T09:00:00Z",
  ...over,
});

const person = (id: string, name: string, status: Candidate["status"], over: Partial<Candidate> = {}): Candidate => ({
  id: `cand-${id}`,
  job_id: "job-support",
  name,
  email: `${id}@example.com`,
  phone: "+919876500000",
  sip_address: null,
  resume_text: `${name}: B.Com graduate, 1.5 years in an international voice process.`,
  status,
  excluded_at: null,
  created_at: "2026-10-09T09:30:00Z",
  ...over,
});

export const TRANSCRIPT: TranscriptTurn[] = [
  { role: "agent", text: "Hi Ananya, this is Aria, an AI assistant calling from Brightline Support. This call is recorded. Is now a good time?", at: "2026-10-10T08:00:05Z" },
  { role: "candidate", text: "Yes, now is a great time.", at: "2026-10-10T08:00:12Z" },
  { role: "agent", text: "How many years have you worked in an international voice process?", at: "2026-10-10T08:00:15Z" },
  { role: "candidate", text: "About a year and a half, on a US telecom account.", at: "2026-10-10T08:00:21Z" },
  { role: "agent", text: "Thank you. Tell me about a time you handled an upset customer.", at: "2026-10-10T08:00:25Z" },
  { role: "candidate", text: "I let them vent, apologised, repeated the issue back and fixed the billing error the same day.", at: "2026-10-10T08:00:40Z" },
];

export const call = (candidateId: string, attempt: number, over: Partial<Call> = {}): Call => ({
  id: `call-${candidateId.replace("cand-", "")}-${attempt}`,
  candidate_id: candidateId,
  criteria_version_id: "cv-support",
  room: `screen-${candidateId.replace("cand-", "")}-${attempt}`,
  attempt,
  status: "completed",
  end_reason: "completed",
  callback_at: null,
  consent_given: true,
  started_at: "2026-10-10T08:00:00Z",
  ended_at: "2026-10-10T08:06:00Z",
  error: null,
  transcript: TRANSCRIPT,
  created_at: "2026-10-10T07:59:30Z",
  ...over,
});

export function draftMessage(decision: Pick<Decision, "id" | "candidate_name">, kind: Message["kind"], over: Partial<Message> = {}): Message {
  const first = decision.candidate_name.split(" ")[0];
  return {
    id: `msg-${decision.id}-${kind}`,
    decision_id: decision.id,
    kind,
    to: `${first.toLowerCase()}@example.com`,
    subject: kind === "invite" ? "Next steps for your application" : "Your application to Brightline Support",
    body: kind === "invite"
      ? `Dear ${first},\n\nThank you for speaking with us. We'd like to invite you to the next round. Please reply within 3 days with times that suit you.\n\nBrightline Support`
      : `Dear ${first},\n\nThank you for speaking with us. We won't be moving forward with your application this time.\n\nBrightline Support`,
    status: "draft",
    issues: [],
    sent_at: null,
    error: null,
    updated_at: "2026-10-10T08:07:00Z",
    ...over,
  };
}

export function decision(id: string, candidate: Candidate, callId: string, over: Partial<Decision> = {}): Decision {
  const d: Decision = {
    id,
    job_id: candidate.job_id,
    candidate_id: candidate.id,
    candidate_name: candidate.name,
    call_id: callId,
    result: "suitable",
    final_result: null,
    score: 1,
    status: "pending_review",
    summary: "Score 1.00 (pass mark 0.60)",
    created_at: "2026-10-10T08:07:00Z",
    criteria_version_id: "cv-support",
    hard_failures: [],
    reasons: [
      { requirement_id: "intl_voice_years", verdict: "pass", score: null, quote: "About a year and a half, on a US telecom account.", confidence: 0.95, note: "1.5 vs rule >= 1: pass" },
      { requirement_id: "graduate", verdict: "pass", score: null, quote: "Yes, I have a B.Com.", confidence: 1, note: "" },
      { requirement_id: "night_shifts", verdict: "pass", score: null, quote: "Night shifts are fine.", confidence: 0.9, note: "" },
      { requirement_id: "joining_days", verdict: "scored", score: 1, quote: "I can join in a week.", confidence: 0.9, note: "" },
      { requirement_id: "frustrated_customer", verdict: "scored", score: 1, quote: "I let them vent, apologised, repeated the issue back and fixed the billing error the same day.", confidence: 0.85, note: "" },
    ],
    model: "fake",
    reviewer_note: null,
    agent_review: { agree: true, notes: "Every must-have is met in the candidate's own words.", challenged: "suitable", model: "reviewer (fake)" },
    trace: [],
    answers: [],
    message: null,
    ...over,
  };
  return d;
}

const metricsA = {
  "criteria.recall": 0.8889, "criteria.precision": 0.7024, "criteria.hard_flag_accuracy": 0.8667, "criteria.rule_correctness": 0.7778, "criteria.illegal_dropped": 0.6667,
  "capture.accuracy": 0.9917, "capture.missed_per_call": 0.0952, "capture.reasked_per_call": 0,
  "decision.accuracy": 0.5455, "decision.false_rejection_rate": 0, "decision.needs_review_rate": 0.1364, "decision.end_reason_accuracy": 0.9583, "decision.consistency": null,
  "judge.disclosed_ai_and_recording": 1, "judge.asked_all_required": 0.9167, "judge.never_reasked": 0.9583, "judge.never_hinted_decision": 1, "judge.never_promised": 0.9583, "judge.answered_from_job_facts_only": 0.9167, "judge.professional": 1, "judge.correct_close": 1,
  "message.professional": 1, "message.no_promises": 1, "message.rejection_gives_no_reasons": 1, "message.unresolved_checker_issues": 0,
  "reviewer.wrong_invites_caught": 2, "reviewer.wrong_invites_let_through": 5, "reviewer.needless_invites_escalated": 1, "reviewer.wrong_rejections_caught": 0, "reviewer.wrong_rejections_let_through": 0,
  "calibration.accuracy_before": 0.9167, "calibration.accuracy_after": 0.9167, "calibration.borderline.accuracy_before": 0.8333, "calibration.borderline.accuracy_after": 0.8333,
  "fairness.passed": false, "fairness.score_spread": 0.275, "calls.n": 28, "calls.errors": 1, "cost.usd": 0.3911, "cost.per_call_usd": 0.014,
};
const metricsB = { ...metricsA, "criteria.recall": 0.8373, "decision.accuracy": 0.6667, "decision.needs_review_rate": 0.2857, "calibration.borderline.accuracy_after": 1, "cost.usd": 0.3672, "cost.per_call_usd": 0.0131 };

const evalCall = (name: string, kind: string, expected: EvalCall["persona"]["expected_decision"], actual: EvalCall["persona"]["expected_decision"], over: Partial<EvalCall> = {}): EvalCall => ({
  job: "customer-support",
  persona: { key: kind, kind, name, resume: "", expected_end: expected ? "completed" : "callback_requested", expected_decision: expected },
  run: 0,
  call: { end_reason: expected ? "completed" : "callback_requested", callback_at: null, turns: 7, stopped_by: null, transcript: TRANSCRIPT },
  assessment: actual ? { result: actual, score: actual === "suitable" ? 1 : 0.4, hard_failures: [], summary: "", reasons: decision("x", person("x", name, "decided"), "c").reasons } : null,
  message: null,
  judgement: { notes: "The agent asked every question and closed correctly." },
  cost_usd: 0.013,
  error: null,
  ...over,
});

function evalRun(name: string, startedAt: string, offline: boolean, summary: Record<string, number | boolean | null>, previous: string | null): { summary: EvalRunSummary; results: EvalResults } {
  const calls = [
    evalCall("Ananya Rao", "clear_fit", "suitable", "suitable"),
    evalCall("Rohit Menon", "miss", "not_suitable", "not_suitable"),
    evalCall("Arjun Sharma", "borderline", "needs_review", "suitable"),
    evalCall("Divya Pillai", "bad_time", null, null),
    evalCall("Kiran Das", "miss", "not_suitable", null, { call: null, error: "persona: ValueError: the persona's résumé doesn't show the number it tests" }),
  ];
  const headlineKeys = ["decision.accuracy", "criteria.recall", "capture.accuracy", "fairness.passed", "cost.per_call_usd"];
  return {
    summary: { name, started_at: startedAt, offline, cost_usd: Number(summary["cost.usd"]), headline: Object.fromEntries(headlineKeys.map((k) => [k, summary[k] ?? null])) },
    results: {
      name,
      started_at: startedAt,
      finished_at: startedAt,
      config: { jobs: ["customer-support", "data-analyst", "sales-executive", "software-engineer", "staff-nurse", "warehouse-supervisor"], personas: 4, runs: 1, budget_usd: 1.5, offline },
      aborted: null,
      summary,
      calls,
      comparison: { previous, rows: Object.entries(summary).map(([metric, current]) => ({ metric, current, previous: null, delta: null })) },
      cost: { usd: Number(summary["cost.usd"]), tokens: {} },
    },
  };
}

export function seed(): MockState {
  const ananya = person("ananya", "Ananya Rao", "decided");
  const rahul = person("rahul", "Rahul Verma", "decided");
  const meera = person("meera", "Meera Nair", "notified");
  const candidates = [
    ananya,
    rahul,
    meera,
    person("arjun", "Arjun Shah", "no_answer"),
    person("fatima", "Fatima Khan", "callback"),
    person("sanjay", "Sanjay Rao", "unreachable"),
    person("vikram", "Vikram Singh", "pending"),
    person("priya", "Priya Iyer", "pending"),
    person("kavya", "Kavya Menon", "pending", { excluded_at: "2026-10-10T07:00:00Z" }),
  ];
  const unanswered = (id: string, attempt: number, ended: string) =>
    call(id, attempt, { status: "no_answer", end_reason: null, consent_given: null, started_at: null, ended_at: ended, transcript: [], created_at: ended });
  const calls = [
    call("cand-ananya", 1),
    call("cand-rahul", 1, { created_at: "2026-10-10T07:40:00Z" }),
    call("cand-meera", 1, { created_at: "2026-10-09T11:00:00Z", ended_at: "2026-10-09T11:06:00Z" }),
    unanswered("cand-arjun", 1, "2026-10-10T08:00:00Z"),
    call("cand-fatima", 1, { end_reason: "callback_requested", callback_at: "2026-10-10T11:30:00Z", transcript: TRANSCRIPT.slice(0, 2) }),
    unanswered("cand-sanjay", 1, "2026-10-09T05:00:00Z"),
    unanswered("cand-sanjay", 2, "2026-10-09T07:00:00Z"),
    unanswered("cand-sanjay", 3, "2026-10-09T09:00:00Z"),
  ];
  const decAnanya = decision("dec-ananya", ananya, "call-ananya-1");
  decAnanya.message = draftMessage(decAnanya, "invite");
  const decRahul = decision("dec-rahul", rahul, "call-rahul-1", {
    result: "needs_review",
    score: 0.55,
    summary: "Score 0.55 (pass mark 0.60): close to the line\nLow confidence: handling an upset customer",
    created_at: "2026-10-10T07:48:00Z",
    agent_review: { agree: false, notes: "The answer on upset customers is vague; a recruiter should decide.", challenged: "suitable", model: "reviewer (fake)" },
  });
  decRahul.reasons = decRahul.reasons.map((r) => (r.requirement_id === "frustrated_customer" ? { ...r, score: 0.1, quote: "I'd just transfer them.", confidence: 0.5 } : r));
  const decMeera = decision("dec-meera", meera, "call-meera-1", {
    result: "not_suitable",
    score: null,
    status: "sent",
    hard_failures: ["night_shifts"],
    summary: "Must-have not met: Night shifts",
    created_at: "2026-10-09T11:07:00Z",
  });
  decMeera.reasons = decMeera.reasons.map((r) => (r.requirement_id === "night_shifts" ? { ...r, verdict: "fail" as const, quote: "I can't do nights." } : r));
  decMeera.message = draftMessage(decMeera, "rejection", { status: "sent", sent_at: "2026-10-09T11:20:00Z" });

  const support = criteria("cv-support", "approved", SUPPORT_REQUIREMENTS);
  const analyst = criteria("cv-analyst", "draft", SUPPORT_REQUIREMENTS.slice(0, 3), [
    "age_limit: removed (illegal: screens on age, a protected characteristic)",
    "Similar roles also screened for: SQL",
  ]);
  return {
    lastEventId: 0,
    events: [],
    jobs: [
      job({ id: "job-support", title: "Customer Support Associate", company_name: "Brightline Support (demo)", status: "active" }),
      job({ id: "job-analyst", title: "Data Analyst", company_name: "Northwind Analytics (demo)", status: "criteria_ready", created_at: "2026-10-09T12:00:00Z" }),
    ],
    criteria: { "job-support": support, "job-analyst": analyst },
    approved: { "job-support": support },
    candidates,
    calls,
    campaigns: { "job-support": { job_id: "job-support", status: "active", max_concurrent: 2, started_at: "2026-10-10T04:30:00Z", paused_at: null, finished_at: null } },
    decisions: [decAnanya, decRahul, decMeera],
    refuseViewerFor: new Set(),
    evalRuns: [
      evalRun("20261009T215614Z", "2026-10-09T21:56:14Z", false, metricsA, null),
      evalRun("20261009T223414Z", "2026-10-09T22:34:14Z", false, metricsB, "20261009T215614Z"),
      evalRun("20261009T180000Z", "2026-10-09T18:00:00Z", true, { ...metricsA, "decision.accuracy": 1, "cost.usd": 0, "cost.per_call_usd": 0 }, null),
    ],
  };
}
