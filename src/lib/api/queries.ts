"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { api } from "./client";
import { ApiError } from "./errors";
import type {
  ActiveCall,
  Call,
  Campaign,
  Candidate,
  CriteriaVersion,
  Decision,
  DecisionStatus,
  DecisionSummary,
  EvalResults,
  EvalRunSummary,
  Job,
} from "./types";

export interface DecisionFilter {
  jobId?: string;
  status?: DecisionStatus;
}

export const qk = {
  health: ["health"] as const,
  jobs: ["jobs"] as const,
  job: (id: string) => ["job", id] as const,
  criteria: (jobId: string) => ["criteria", jobId] as const,
  approvedCriteria: (jobId: string) => ["criteria", jobId, "approved"] as const,
  campaign: (jobId: string) => ["campaign", jobId] as const,
  candidates: (jobId: string) => ["candidates", jobId] as const,
  candidate: (id: string) => ["candidate", id] as const,
  calls: (candidateId: string) => ["calls", candidateId] as const,
  activeCalls: ["activeCalls"] as const,
  decisions: (filter: DecisionFilter) => ["decisions", filter] as const,
  decision: (id: string) => ["decision", id] as const,
  evalRuns: ["evalRuns"] as const,
  evalRun: (name: string) => ["evalRun", name] as const,
};

function nullOn404<T>(p: Promise<T>): Promise<T | null> {
  return p.catch((e: unknown) => {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  });
}

export const fetchCandidates = (jobId: string) => api<Candidate[]>(`/jobs/${jobId}/candidates?limit=200`);
export const fetchCalls = (candidateId: string) => api<Call[]>(`/candidates/${candidateId}/calls`);

export function useHealth() {
  return useQuery({
    queryKey: qk.health,
    queryFn: () => api<{ ok: boolean }>("/health"),
    retry: false,
    refetchInterval: (q) => (q.state.status === "error" ? 5_000 : 30_000),
  });
}

export function useJobs() {
  return useQuery({ queryKey: qk.jobs, queryFn: () => api<Job[]>("/jobs?limit=200") });
}

export function useJob(id: string | undefined) {
  return useQuery({ queryKey: qk.job(id ?? ""), queryFn: () => api<Job>(`/jobs/${id}`), enabled: Boolean(id) });
}

export function useCriteria(jobId: string) {
  return useQuery({ queryKey: qk.criteria(jobId), queryFn: () => api<CriteriaVersion>(`/jobs/${jobId}/criteria`) });
}

export function useApprovedCriteria(jobId: string | undefined) {
  return useQuery({
    queryKey: qk.approvedCriteria(jobId ?? ""),
    queryFn: () => nullOn404(api<CriteriaVersion>(`/jobs/${jobId}/criteria?status=approved`)),
    enabled: Boolean(jobId),
    staleTime: 60_000,
  });
}

export function useCampaign(jobId: string) {
  return useQuery({ queryKey: qk.campaign(jobId), queryFn: () => nullOn404(api<Campaign>(`/jobs/${jobId}/campaign`)) });
}

export function useCandidates(jobId: string) {
  return useQuery({ queryKey: qk.candidates(jobId), queryFn: () => fetchCandidates(jobId) });
}

export function useCandidate(id: string | undefined) {
  return useQuery({ queryKey: qk.candidate(id ?? ""), queryFn: () => api<Candidate>(`/candidates/${id}`), enabled: Boolean(id) });
}

export function useCalls(candidateId: string | undefined) {
  return useQuery({ queryKey: qk.calls(candidateId ?? ""), queryFn: () => fetchCalls(candidateId ?? ""), enabled: Boolean(candidateId) });
}

export function useCandidatesCalls(ids: string[]) {
  // ponytail: one request per candidate; add GET /jobs/{id}/calls if jobs grow past a few dozen candidates
  return useQueries({
    queries: ids.map((id) => ({ queryKey: qk.calls(id), queryFn: () => fetchCalls(id) })),
    combine: (results) => ({
      byCandidate: Object.fromEntries(ids.map((id, i) => [id, results[i]?.data ?? []])),
      isPending: results.some((r) => r.isPending),
    }),
  });
}

export function useAllCandidates(jobs: Job[] | undefined) {
  return useQueries({
    queries: (jobs ?? []).map((j) => ({ queryKey: qk.candidates(j.id), queryFn: () => fetchCandidates(j.id) })),
    combine: (results) => ({
      data: results.flatMap((r) => r.data ?? []),
      isPending: results.some((r) => r.isPending),
      error: results.find((r) => r.error)?.error ?? null,
    }),
  });
}

export function useActiveCalls() {
  return useQuery({ queryKey: qk.activeCalls, queryFn: () => api<ActiveCall[]>("/calls?status=in_progress") });
}

export function useDecisions(filter: DecisionFilter = {}) {
  const q = new URLSearchParams({ limit: "200" });
  if (filter.jobId) q.set("job_id", filter.jobId);
  if (filter.status) q.set("status", filter.status);
  return useQuery({ queryKey: qk.decisions(filter), queryFn: () => api<DecisionSummary[]>(`/decisions?${q}`) });
}

export function useDecision(id: string | undefined) {
  return useQuery({ queryKey: qk.decision(id ?? ""), queryFn: () => api<Decision>(`/decisions/${id}`), enabled: Boolean(id) });
}

export function useEvalRuns() {
  return useQuery({ queryKey: qk.evalRuns, queryFn: () => api<EvalRunSummary[]>("/evals/runs"), staleTime: 5 * 60_000 });
}

export function useEvalRun(name: string | null) {
  return useQuery({
    queryKey: qk.evalRun(name ?? ""),
    queryFn: () => api<EvalResults>(`/evals/runs/${encodeURIComponent(name ?? "")}`),
    enabled: Boolean(name),
    staleTime: Infinity, // a finished run never changes
  });
}
