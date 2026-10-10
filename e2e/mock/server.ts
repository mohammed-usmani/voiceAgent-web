// A stand-in for the screening backend (voiceAgent's FastAPI app) for end-to-end tests:
// the same routes and shapes, in memory, plus /__test/* routes that make things happen.
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { ApiEvent, Call, Campaign, Candidate, CriteriaVersion, Decision, DecisionSummary, Job } from "../../src/lib/api/types";
import { call as makeCall, decision as makeDecision, draftMessage, generatedCriteria, type MockState, seed, type StoredCampaign, TRANSCRIPT } from "./fixtures.ts";

const PORT = Number(process.env.MOCK_PORT ?? 8787);
const API_KEY = "test-key";
const ACTIVE = ["queued", "ringing", "in_progress"];
const FINISHED = ["screened", "decided", "notified", "declined_consent", "withdrawn"];

let state: MockState = seed();
const streams = new Set<ServerResponse>();
const now = () => new Date().toISOString();

class HttpError extends Error {
  status: number;
  detail: unknown;
  constructor(status: number, detail: unknown) {
    super(typeof detail === "string" ? detail : "error");
    this.status = status;
    this.detail = detail;
  }
}

function emit(entity: ApiEvent["entity"], entityId: string, type: string, data: Record<string, unknown> = {}): void {
  const event: ApiEvent = { id: ++state.lastEventId, entity, entity_id: entityId, type, data, created_at: now() };
  state.events.push(event);
  for (const res of streams) res.write(`id: ${event.id}\ndata: ${JSON.stringify(event)}\n\n`);
}

function find<T extends { id: string }>(items: T[], id: string, what: string): T {
  const item = items.find((x) => x.id === id);
  if (!item) throw new HttpError(404, `${what} not found`);
  return item;
}

const field = <T>(body: unknown, key: string): T | undefined =>
  typeof body === "object" && body !== null && key in body ? ((body as Record<string, unknown>)[key] as T) : undefined;

function summaryOf(d: Decision): DecisionSummary {
  const { id, job_id, candidate_id, candidate_name, call_id, result, final_result, score, status, summary, created_at } = d;
  return { id, job_id, candidate_id, candidate_name, call_id, result, final_result, score, status, summary, created_at };
}

function campaignOut(c: StoredCampaign): Campaign {
  const mine = state.candidates.filter((x) => x.job_id === c.job_id);
  const counts: Campaign["candidates"] = {};
  for (const x of mine) counts[x.status] = (counts[x.status] ?? 0) + 1;
  const inFlight = state.calls.filter((k) => ACTIVE.includes(k.status) && mine.some((x) => x.id === k.candidate_id)).length;
  return { ...c, in_flight: inFlight, candidates: counts };
}

function newCall(c: Candidate, status: Call["status"]): Call {
  const attempt = state.calls.filter((k) => k.candidate_id === c.id).length + 1;
  const k = makeCall(c.id, attempt, { status, end_reason: null, started_at: status === "in_progress" ? now() : null, ended_at: null, transcript: [], created_at: now(), consent_given: null });
  state.calls.push(k);
  c.status = "calling";
  return k;
}

type Handler = (params: Record<string, string>, body: unknown, url: URL, res: ServerResponse) => unknown;
const STREAMING = Symbol("streaming");
const routes: { method: string; re: RegExp; keys: string[]; status: number; handler: Handler }[] = [];

function route(method: string, pattern: string, status: number, handler: Handler): void {
  const keys: string[] = [];
  const source = pattern.replace(/[.*+?^$()|[\]\\]/g, "\\$&").replace(/\{(\w+)\}/g, (_m, k: string) => {
    keys.push(k);
    return "([^/:]+)";
  });
  routes.push({ method, re: new RegExp(`^${source}$`), keys, status, handler });
}

/* ---- the API ---- */

route("GET", "/health", 200, () => ({ ok: true }));

route("GET", "/events/stream", 200, (_p, _b, url, res) => {
  res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" });
  res.write(": connected\n\n");
  const after = Number(url.searchParams.get("after"));
  if (url.searchParams.has("after")) for (const e of state.events) if (e.id > after) res.write(`id: ${e.id}\ndata: ${JSON.stringify(e)}\n\n`);
  streams.add(res);
  res.on("close", () => streams.delete(res));
  return STREAMING;
});

route("GET", "/jobs", 200, () => [...state.jobs].sort((a, b) => b.created_at.localeCompare(a.created_at)));
route("POST", "/jobs", 201, (_p, body) => {
  const description = field<string>(body, "description") ?? "";
  if (description.length < 50) throw new HttpError(422, [{ loc: ["body", "description"], msg: "String should have at least 50 characters", type: "string_too_short" }]);
  const job: Job = {
    id: `job-${Math.random().toString(36).slice(2, 8)}`,
    title: field<string>(body, "title") ?? "",
    company_name: field<string>(body, "company_name") ?? "",
    description,
    recruiter_notes: field<string>(body, "recruiter_notes") ?? "",
    agent_name: field<string>(body, "agent_name") ?? "Aria",
    timezone: field<string>(body, "timezone") ?? "Asia/Kolkata",
    auto_send_invites: true,
    response_days: 3,
    voice: field<string>(body, "voice") ?? "default",
    calling_hours: field<Job["calling_hours"]>(body, "calling_hours") ?? { start: "10:00", end: "19:00" },
    criteria_stale: false,
    status: "generating",
    created_at: now(),
  };
  state.jobs.push(job);
  emit("job", job.id, "created", { title: job.title });
  return job;
});
route("GET", "/jobs/{id}", 200, (p) => find(state.jobs, p.id, "job"));

route("GET", "/jobs/{id}/criteria", 200, (p, _b, url) => {
  find(state.jobs, p.id, "job");
  const cv = url.searchParams.get("status") === "approved" ? state.approved[p.id] : state.criteria[p.id];
  if (!cv) throw new HttpError(404, url.searchParams.has("status") ? "no approved criteria" : "no criteria yet");
  return cv;
});
route("PATCH", "/jobs/{id}/criteria", 200, (p, body) => {
  const job = find(state.jobs, p.id, "job");
  const cv = state.criteria[p.id];
  if (!cv) throw new HttpError(409, `no criteria to edit (job is ${job.status})`);
  const edit = {
    requirements: field<CriteriaVersion["requirements"]>(body, "requirements") ?? cv.requirements,
    job_facts: field<CriteriaVersion["job_facts"]>(body, "job_facts") ?? cv.job_facts,
    pass_threshold: field<number>(body, "pass_threshold") ?? cv.pass_threshold,
    model: "recruiter edit",
  };
  const next: CriteriaVersion = cv.status === "draft" ? { ...cv, ...edit } : { ...cv, ...edit, id: `${cv.id}-v${cv.version + 1}`, version: cv.version + 1, status: "draft", approved_at: null };
  state.criteria[p.id] = next;
  emit("job", job.id, "criteria_edited", { version: next.version });
  return next;
});
route("POST", "/jobs/{id}/criteria:approve", 200, (p) => {
  const job = find(state.jobs, p.id, "job");
  const cv = state.criteria[p.id];
  if (cv?.status !== "draft") throw new HttpError(409, "no draft criteria to approve");
  const approved: CriteriaVersion = { ...cv, status: "approved", approved_at: now() };
  state.criteria[p.id] = approved;
  state.approved[p.id] = approved;
  job.status = "active";
  emit("job", job.id, "criteria_approved", { version: approved.version });
  return approved;
});
route("POST", "/jobs/{id}/criteria:regenerate", 202, (p) => {
  const job = find(state.jobs, p.id, "job");
  if (job.status !== "active") job.status = "generating";
  emit("job", job.id, "criteria_regenerating");
  return job;
});

route("GET", "/jobs/{id}/candidates", 200, (p) => state.candidates.filter((c) => c.job_id === p.id));
route("POST", "/jobs/{id}/candidates", 201, (p, body) => {
  find(state.jobs, p.id, "job");
  const email = (field<string>(body, "email") ?? "").toLowerCase();
  if (state.candidates.some((c) => c.job_id === p.id && c.email === email)) throw new HttpError(409, `email: ${email} was already added to this job`);
  const phone = field<string>(body, "phone") ?? null;
  if (phone && !/^\+[1-9]\d{7,14}$/.test(phone)) throw new HttpError(422, [{ loc: ["body", "phone"], msg: "Value error, phone must be in international format, like +919876543210", type: "value_error" }]);
  const c: Candidate = {
    id: `cand-${Math.random().toString(36).slice(2, 8)}`,
    job_id: p.id,
    name: field<string>(body, "name") ?? "",
    email,
    phone,
    sip_address: field<string>(body, "sip_address") ?? null,
    resume_text: field<string>(body, "resume_text") ?? "",
    status: "pending",
    excluded_at: null,
    created_at: now(),
  };
  state.candidates.push(c);
  emit("candidate", c.id, "created", { job_id: p.id });
  return c;
});
route("POST", "/jobs/{id}/candidates:import", 200, (p, body) => {
  const [header = "", ...lines] = String(body ?? "").trim().split(/\r?\n/);
  const cols = header.split(",").map((h) => h.trim().toLowerCase());
  let created = 0;
  const errors: { row: number; errors: string[] }[] = [];
  lines.forEach((line, i) => {
    const cells = line.split(",");
    const row = Object.fromEntries(cols.map((c, j) => [c, (cells[j] ?? "").trim()]));
    if (!row.email?.includes("@")) {
      errors.push({ row: i + 2, errors: [`email: '${row.email ?? ""}' is not an email address`] });
      return;
    }
    state.candidates.push({ id: `cand-${Math.random().toString(36).slice(2, 8)}`, job_id: p.id, name: row.name ?? "", email: row.email, phone: row.phone || null, sip_address: row.sip_address || null, resume_text: row.resume_text ?? "", status: "pending", excluded_at: null, created_at: now() });
    created += 1;
  });
  emit("job", p.id, "candidates_imported", { created, errors: errors.length });
  return { created, errors };
});

route("GET", "/candidates/{id}", 200, (p) => find(state.candidates, p.id, "candidate"));
route("DELETE", "/candidates/{id}", 204, (p) => {
  const c = find(state.candidates, p.id, "candidate");
  state.candidates = state.candidates.filter((x) => x.id !== c.id);
  state.calls = state.calls.filter((k) => k.candidate_id !== c.id);
  state.decisions = state.decisions.filter((d) => d.candidate_id !== c.id);
  emit("candidate", c.id, "deleted", { job_id: c.job_id });
  return null;
});
route("POST", "/candidates/{id}:exclude", 200, (p) => {
  const c = find(state.candidates, p.id, "candidate");
  c.excluded_at = now();
  emit("candidate", c.id, "excluded", { job_id: c.job_id });
  return c;
});
route("POST", "/candidates/{id}:include", 200, (p) => {
  const c = find(state.candidates, p.id, "candidate");
  c.excluded_at = null;
  emit("candidate", c.id, "included", { job_id: c.job_id });
  return c;
});
route("POST", "/candidates/{id}/call", 202, (p, body) => {
  const c = find(state.candidates, p.id, "candidate");
  if (c.excluded_at) throw new HttpError(409, "calling is stopped for this candidate: resume calling first");
  if (FINISHED.includes(c.status) && field<boolean>(body, "force") !== true) throw new HttpError(409, `candidate is ${c.status}; send {"force": true} to call again`);
  const k = newCall(c, "queued");
  emit("call", k.id, "queued", { candidate_id: c.id, attempt: k.attempt });
  return k;
});
route("GET", "/candidates/{id}/calls", 200, (p) => state.calls.filter((k) => k.candidate_id === p.id).sort((a, b) => a.attempt - b.attempt));

route("GET", "/calls", 200, (_p, _b, url) => {
  const status = url.searchParams.get("status");
  const jobId = url.searchParams.get("job_id");
  return state.calls
    .filter((k) => !status || k.status === status)
    .map((k) => {
      const c = find(state.candidates, k.candidate_id, "candidate");
      const job = find(state.jobs, c.job_id, "job");
      return { ...k, candidate_name: c.name, job_id: job.id, job_title: job.title };
    })
    .filter((k) => !jobId || k.job_id === jobId);
});
route("GET", "/calls/{id}", 200, (p) => find(state.calls, p.id, "call"));
route("POST", "/calls/{id}/viewer-token", 200, (p) => {
  const k = find(state.calls, p.id, "call");
  if (!ACTIVE.includes(k.status)) throw new HttpError(409, `the call is ${k.status}`);
  if (state.refuseViewerFor.has(k.candidate_id)) throw new HttpError(409, "live view refused (test)");
  return { url: "fake://livekit", token: "fake-token", room: k.room };
});

route("GET", "/jobs/{id}/campaign", 200, (p) => {
  const c = state.campaigns[p.id];
  if (!c) throw new HttpError(404, "this job has no campaign");
  return campaignOut(c);
});
route("POST", "/jobs/{id}/campaign", 200, (p, body) => {
  const job = find(state.jobs, p.id, "job");
  if (job.status !== "active" || !state.approved[p.id]) throw new HttpError(409, `job is ${job.status}: approve its criteria before calling`);
  const c = state.campaigns[p.id] ?? { job_id: p.id, status: "active", max_concurrent: 2, started_at: now(), paused_at: null, finished_at: null };
  const max = field<number>(body, "max_concurrent");
  const changed = c.status !== "active" || (max !== undefined && max !== c.max_concurrent);
  c.status = "active";
  c.paused_at = null;
  if (max !== undefined) c.max_concurrent = max;
  state.campaigns[p.id] = c;
  if (changed) emit("job", p.id, "campaign_started", { max_concurrent: c.max_concurrent });
  return campaignOut(c);
});
route("POST", "/jobs/{id}/campaign:pause", 200, (p) => {
  const c = state.campaigns[p.id];
  if (!c) throw new HttpError(404, "this job has no campaign");
  if (c.status === "active") {
    c.status = "paused";
    c.paused_at = now();
    emit("job", p.id, "campaign_paused");
  }
  return campaignOut(c);
});

route("GET", "/decisions", 200, (_p, _b, url) => {
  const jobId = url.searchParams.get("job_id");
  const status = url.searchParams.get("status");
  return state.decisions
    .filter((d) => (!jobId || d.job_id === jobId) && (!status || d.status === status))
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map(summaryOf);
});
route("GET", "/decisions/{id}", 200, (p) => find(state.decisions, p.id, "decision"));
route("POST", "/decisions/{id}:approve", 200, (p, body) => {
  const d = find(state.decisions, p.id, "decision");
  if (d.status === "sent") throw new HttpError(409, "the message was already sent");
  const result = d.final_result ?? d.result;
  if (result === "needs_review") throw new HttpError(409, "the result is needs_review: choose one with :override");
  if (!d.message || !["draft", "failed"].includes(d.message.status)) throw new HttpError(409, "the message is still being drafted");
  const c = find(state.candidates, d.candidate_id, "candidate");
  if (c.status === "notified" && field<boolean>(body, "force") !== true) throw new HttpError(409, 'the candidate was already notified; send {"force": true} to email them anyway');
  d.status = "approved";
  d.message = { ...d.message, status: "queued" };
  emit("decision", d.id, "approved", { result });
  emit("message", d.message.id, "queued", { decision_id: d.id });
  return d;
});
route("POST", "/decisions/{id}:override", 200, (p, body) => {
  const d = find(state.decisions, p.id, "decision");
  if (!["pending_review", "overridden"].includes(d.status)) throw new HttpError(409, `the decision is already ${d.status}`);
  const result = field<"suitable" | "not_suitable">(body, "result") ?? "suitable";
  d.final_result = result;
  d.reviewer_note = field<string>(body, "note") ?? "";
  d.status = "overridden";
  const kind = result === "suitable" ? "invite" : "rejection";
  if (d.message?.kind !== kind) d.message = draftMessage(d, kind);
  emit("decision", d.id, "overridden", { from: d.result, to: result });
  return d;
});
route("PATCH", "/messages/{id}", 200, (p, body) => {
  const d = state.decisions.find((x) => x.message?.id === p.id);
  if (!d?.message) throw new HttpError(404, "message not found");
  if (!["draft", "failed"].includes(d.message.status)) throw new HttpError(409, `the message is already ${d.message.status}`);
  const subject = field<string>(body, "subject");
  const text = field<string>(body, "body");
  d.message = { ...d.message, ...(subject ? { subject } : {}), ...(text ? { body: text } : {}), updated_at: now() };
  emit("message", p.id, "edited", { fields: [subject && "subject", text && "body"].filter(Boolean) });
  return d.message;
});

route("GET", "/evals/runs", 200, () => state.evalRuns.map((r) => r.summary));
route("GET", "/evals/runs/{name}", 200, (p) => {
  const run = state.evalRuns.find((r) => r.summary.name === p.name);
  if (!run) throw new HttpError(404, "run not found");
  return run.results;
});

/* ---- test controls ---- */

route("POST", "/__test/reset", 200, () => {
  const lastEventId = state.lastEventId; // ids keep growing, like the real table's
  state = seed();
  state.lastEventId = lastEventId;
  return { ok: true };
});
route("POST", "/__test/criteria", 200, (_p, body) => {
  const jobId = field<string>(body, "jobId") ?? "";
  const job = find(state.jobs, jobId, "job");
  const delay = field<number>(body, "delayMs") ?? 0;
  const steps: [string, number, string][] = [
    ["retrieve", 1, "2 similar roles"],
    ["draft", 1, "6 requirements"],
    ["critique", 1, "1 illegal, 1 ungrounded"],
    ["revise", 1, "5 requirements"],
    ["critique", 2, "no issues"],
    ["finalize", 2, "4 kept · 1 removed"],
  ];
  steps.forEach(([step, round, summary], i) => setTimeout(() => emit("job", jobId, "criteria_step", { step, round, summary }), i * delay));
  setTimeout(() => {
    state.criteria[jobId] = generatedCriteria();
    job.status = "criteria_ready";
    emit("job", jobId, "criteria_ready", { version: 1, rounds: 2 });
  }, steps.length * delay + 10);
  return { ok: true };
});
route("POST", "/__test/answer", 200, (_p, body) => {
  const c = find(state.candidates, field<string>(body, "candidateId") ?? "", "candidate");
  const k = newCall(c, "in_progress");
  k.started_at = field<string>(body, "startedAt") ?? now();
  emit("call", k.id, "ringing");
  emit("call", k.id, "answered");
  return k;
});
route("POST", "/__test/end", 200, (_p, body) => {
  const k = find(state.calls, field<string>(body, "callId") ?? "", "call");
  const reason = field<string>(body, "reason") ?? "completed";
  k.status = "completed";
  k.end_reason = reason;
  k.ended_at = now();
  k.transcript = TRANSCRIPT;
  find(state.candidates, k.candidate_id, "candidate").status = "screened";
  emit("call", k.id, "ended", { end_reason: reason, turns: TRANSCRIPT.length });
  return k;
});
route("POST", "/__test/decide", 200, (_p, body) => {
  const k = find(state.calls, field<string>(body, "callId") ?? "", "call");
  const c = find(state.candidates, k.candidate_id, "candidate");
  const result = field<Decision["result"]>(body, "result") ?? "suitable";
  const d = makeDecision(`dec-${k.id}`, c, k.id, { result, created_at: now() });
  if (result !== "needs_review") d.message = draftMessage(d, result === "suitable" ? "invite" : "rejection");
  state.decisions.push(d);
  c.status = "decided";
  emit("decision", d.id, "created", { call_id: k.id, candidate_id: c.id, result });
  return d;
});
route("POST", "/__test/refuse-viewer", 200, (_p, body) => {
  state.refuseViewerFor.add(field<string>(body, "candidateId") ?? "");
  return { ok: true };
});
route("POST", "/__test/drop-streams", 200, () => {
  for (const res of streams) res.destroy();
  streams.clear();
  return { ok: true };
});

/* ---- server ---- */

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const text = Buffer.concat(chunks).toString("utf8");
  if (!text) return null;
  if (!req.headers["content-type"]?.includes("json")) return text;
  const value: unknown = JSON.parse(text);
  return value;
}

function send(res: ServerResponse, status: number, body: unknown): void {
  if (status === 204) {
    res.writeHead(204).end();
    return;
  }
  res.writeHead(status, { "content-type": "application/json" }).end(JSON.stringify(body));
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const path = decodeURIComponent(url.pathname);
  const open = path === "/health" || path.startsWith("/__test/");
  if (!open && req.headers["x-api-key"] !== API_KEY) return send(res, 401, { detail: "invalid or missing API key" });
  for (const r of routes) {
    const m = r.method === req.method ? r.re.exec(path) : null;
    if (!m) continue;
    try {
      const params = Object.fromEntries(r.keys.map((k, i) => [k, m[i + 1]]));
      const out = r.handler(params, await readBody(req), url, res);
      if (out !== STREAMING) send(res, r.status, out);
    } catch (e) {
      if (e instanceof HttpError) send(res, e.status, { detail: e.detail });
      else {
        console.error(e);
        send(res, 500, { detail: String(e) });
      }
    }
    return;
  }
  send(res, 404, { detail: "Not Found" });
}).listen(PORT, "127.0.0.1", () => console.log(`fake screening backend on http://127.0.0.1:${PORT}`));
