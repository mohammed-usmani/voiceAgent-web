"use client";

import { type QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "./client";
import { isForceable, messageOf } from "./errors";
import { qk } from "./queries";
import type {
  Call,
  Campaign,
  Candidate,
  CandidateCreate,
  Criteria,
  CriteriaVersion,
  Decision,
  ImportResult,
  Job,
  JobCreate,
  Message,
  Override,
} from "./types";

interface ActionOptions<V, R> {
  success?: (result: R, vars: V) => string;
  invalidate?: (result: R, vars: V) => QueryKey[];
}
export interface Quiet {
  quiet?: boolean;
}

function useAction<V, R>(fn: (vars: V) => Promise<R>, opts: ActionOptions<V, R>, { quiet = false }: Quiet = {}) {
  const qc = useQueryClient();
  return useMutation<R, Error, V>({
    mutationFn: fn,
    onSuccess: (result, vars) => {
      for (const key of opts.invalidate?.(result, vars) ?? []) void qc.invalidateQueries({ queryKey: key });
      const text = opts.success?.(result, vars);
      if (text) toast.success(text);
    },
    onError: (e) => {
      if (!quiet && !isForceable(e)) toast.error(messageOf(e));
    },
  });
}

export const useCreateJob = (q?: Quiet) =>
  useAction((body: JobCreate) => api<Job>("/jobs", { body }), { invalidate: () => [qk.jobs] }, q);

export const useSaveCriteria = (jobId: string) =>
  useAction((body: Criteria) => api<CriteriaVersion>(`/jobs/${jobId}/criteria`, { method: "PATCH", body }), {
    success: (r) => `Saved as draft v${r.version}`,
    invalidate: () => [qk.criteria(jobId)],
  });

export const useApproveCriteria = (jobId: string) =>
  useAction<void, CriteriaVersion>(() => api(`/jobs/${jobId}/criteria:approve`, { method: "POST" }), {
    success: (r) => `Criteria v${r.version} approved`,
    invalidate: () => [qk.criteria(jobId), qk.job(jobId), qk.jobs],
  });

export const useRegenerateCriteria = (jobId: string) =>
  useAction<void, Job>(() => api(`/jobs/${jobId}/criteria:regenerate`, { method: "POST" }), {
    success: () => "Regenerating the criteria",
    invalidate: () => [qk.job(jobId), qk.jobs],
  });

export const useAddCandidate = (jobId: string, q?: Quiet) =>
  useAction((body: CandidateCreate) => api<Candidate>(`/jobs/${jobId}/candidates`, { body }), {
    success: (c) => `Added ${c.name}`,
    invalidate: () => [qk.candidates(jobId), qk.campaign(jobId)],
  }, q);

export const useImportCandidates = (jobId: string, q?: Quiet) =>
  useAction((csv: string) => api<ImportResult>(`/jobs/${jobId}/candidates:import`, { method: "POST", csv }), {
    invalidate: () => [qk.candidates(jobId), qk.campaign(jobId)],
  }, q);

export const useCallCandidate = () =>
  useAction(({ id, force = false }: { id: string; force?: boolean }) => api<Call>(`/candidates/${id}/call`, { body: { force } }), {
    success: () => "Call queued",
    invalidate: (_r, v) => [qk.candidate(v.id), qk.calls(v.id), ["candidates"]],
  });

export const useSetExcluded = () =>
  useAction(({ id, excluded }: { id: string; excluded: boolean }) => api<unknown>(`/candidates/${id}:${excluded ? "exclude" : "include"}`, { method: "POST" }), {
    success: (_r, v) => (v.excluded ? "Calling stopped" : "Calling resumed"),
    invalidate: (_r, v) => [qk.candidate(v.id), ["candidates"], ["campaign"]],
  });

export const useDeleteCandidate = () =>
  useAction(({ id }: { id: string; jobId: string }) => api<void>(`/candidates/${id}`, { method: "DELETE" }), {
    success: () => "Candidate deleted",
    invalidate: (_r, v) => [qk.candidates(v.jobId), qk.campaign(v.jobId)],
  });

export const useStartCampaign = (jobId: string) =>
  useAction(({ maxConcurrent }: { maxConcurrent?: number }) => api<Campaign>(`/jobs/${jobId}/campaign`, { body: maxConcurrent ? { max_concurrent: maxConcurrent } : {} }), {
    invalidate: () => [qk.campaign(jobId)],
  });

export const usePauseCampaign = (jobId: string) =>
  useAction<void, Campaign>(() => api(`/jobs/${jobId}/campaign:pause`, { method: "POST" }), {
    success: () => "Campaign paused",
    invalidate: () => [qk.campaign(jobId)],
  });

export const useApproveDecision = () =>
  useAction(({ id, force = false }: { id: string; force?: boolean }) => api<Decision>(`/decisions/${id}:approve`, { body: { force } }), {
    success: () => "Approved: the message is being sent",
    invalidate: (_r, v) => [qk.decision(v.id), ["decisions"]],
  });

export const useOverrideDecision = () =>
  useAction(({ id, body }: { id: string; body: Override }) => api<Decision>(`/decisions/${id}:override`, { body }), {
    success: () => "Override saved: the message is being redrafted",
    invalidate: (_r, v) => [qk.decision(v.id), ["decisions"]],
  });

export const useEditMessage = () =>
  useAction(({ id, subject, body }: { id: string; decisionId: string; subject: string; body: string }) => api<Message>(`/messages/${id}`, { method: "PATCH", body: { subject, body } }), {
    success: () => "Message saved",
    invalidate: (_r, v) => [qk.decision(v.decisionId)],
  });
