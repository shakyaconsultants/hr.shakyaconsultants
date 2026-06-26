import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  archiveCandidate,
  convertCandidate,
  createCandidate,
  createInterview,
  exportCandidates,
  fetchCandidate,
  fetchCandidateTimeline,
  fetchCandidates,
  fetchInterviews,
  fetchKanban,
  fetchOffers,
  fetchOnboarding,
  fetchPipelineStages,
  fetchRecruitmentDashboard,
  restoreCandidate,
  saveOnboardingDraft,
  transitionPipeline,
  updateCandidate,
  uploadResume,
  type ListCandidatesParams,
} from '@/features/recruitment/api/recruitment.api';

export function useRecruitmentDashboard() {
  return useQuery({
    queryKey: ['recruitment', 'dashboard'],
    queryFn: fetchRecruitmentDashboard,
  });
}

export function useCandidates(params: ListCandidatesParams = {}) {
  return useQuery({
    queryKey: ['recruitment', 'candidates', params],
    queryFn: () => fetchCandidates(params),
  });
}

export function useCandidate(id: string) {
  return useQuery({
    queryKey: ['recruitment', 'candidate', id],
    queryFn: () => fetchCandidate(id),
    enabled: Boolean(id),
  });
}

export function useKanban() {
  return useQuery({
    queryKey: ['recruitment', 'kanban'],
    queryFn: fetchKanban,
  });
}

export function usePipelineStages() {
  return useQuery({
    queryKey: ['recruitment', 'pipeline-stages'],
    queryFn: fetchPipelineStages,
  });
}

export function useCandidateTimeline(candidateId: string) {
  return useQuery({
    queryKey: ['recruitment', 'candidate', candidateId, 'timeline'],
    queryFn: () => fetchCandidateTimeline(candidateId),
    enabled: Boolean(candidateId),
  });
}

export function useInterviews(params: { candidateLeadId?: string; from?: string; to?: string } = {}) {
  return useQuery({
    queryKey: ['recruitment', 'interviews', params],
    queryFn: () => fetchInterviews(params),
  });
}

export function useOffers(candidateLeadId?: string) {
  return useQuery({
    queryKey: ['recruitment', 'offers', candidateLeadId],
    queryFn: () => fetchOffers(candidateLeadId ? { candidateLeadId } : {}),
  });
}

export function useOnboarding(candidateId: string) {
  return useQuery({
    queryKey: ['recruitment', 'onboarding', candidateId],
    queryFn: () => fetchOnboarding(candidateId),
    enabled: Boolean(candidateId),
  });
}

export function useCreateCandidate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCandidate,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['recruitment'] });
    },
  });
}

export function useUpdateCandidate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => updateCandidate(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['recruitment'] });
      void queryClient.invalidateQueries({ queryKey: ['recruitment', 'candidate', variables.id] });
    },
  });
}

export function useArchiveCandidate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: archiveCandidate,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['recruitment'] });
    },
  });
}

export function useRestoreCandidate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: restoreCandidate,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['recruitment'] });
    },
  });
}

export function useTransitionPipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ candidateId, stage, reason }: { candidateId: string; stage: string; reason?: string }) =>
      transitionPipeline(candidateId, stage, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['recruitment'] });
    },
  });
}

export function useCreateInterview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInterview,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['recruitment'] });
    },
  });
}

export function useConvertCandidate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: convertCandidate,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['recruitment'] });
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useSaveOnboardingDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ candidateId, payload }: { candidateId: string; payload: Record<string, unknown> }) =>
      saveOnboardingDraft(candidateId, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['recruitment', 'onboarding', variables.candidateId] });
    },
  });
}

export function useExportCandidates() {
  return useMutation({
    mutationFn: exportCandidates,
  });
}

export function useUploadResume() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ candidateId, file }: { candidateId: string; file: File }) => uploadResume(candidateId, file),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['recruitment', 'candidate', variables.candidateId] });
      void queryClient.invalidateQueries({ queryKey: ['recruitment', 'candidate', variables.candidateId, 'timeline'] });
    },
  });
}
