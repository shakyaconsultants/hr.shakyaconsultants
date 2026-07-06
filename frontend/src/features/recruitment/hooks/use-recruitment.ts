import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppMutation } from '@/shared/feedback/use-app-mutation';
import {
  archiveCandidate,
  acceptOffer,
  convertCandidate,
  createCandidate,
  createInterview,
  createOffer,
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
  issueOnboardingPortal,
  rejectOffer,
  restoreCandidate,
  saveOnboardingDraft,
  sendOffer,
  sendOfferWithOnboarding,
  startOnboarding,
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

export function useInterviews(
  params: { candidateLeadId?: string; from?: string; to?: string } = {},
) {
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
    retry: false,
  });
}

export function useCreateCandidate() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: createCandidate,
    errorToast: false,
    successMessage: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['recruitment'] });
    },
  });
}

export function useUpdateCandidate() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      updateCandidate(id, payload),
    errorToast: false,
    successMessage: false,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['recruitment'] });
      void queryClient.invalidateQueries({ queryKey: ['recruitment', 'candidate', variables.id] });
    },
  });
}

export function useArchiveCandidate() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: archiveCandidate,
    errorToast: false,
    successMessage: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['recruitment'] });
    },
  });
}

export function useRestoreCandidate() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: restoreCandidate,
    errorToast: false,
    successMessage: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['recruitment'] });
    },
  });
}

export function useTransitionPipeline() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({
      candidateId,
      stage,
      reason,
    }: {
      candidateId: string;
      stage: string;
      reason?: string;
    }) => transitionPipeline(candidateId, stage, reason),
    errorToast: false,
    successMessage: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['recruitment'] });
    },
  });
}

export function useCreateInterview() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: createInterview,
    successMessage: 'Interview scheduled — invite email sent',
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['recruitment'] });
    },
  });
}

export function useCreateOffer() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: createOffer,
    successMessage: 'Offer draft created',
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['recruitment'] });
    },
  });
}

export function useSendOffer() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: sendOffer,
    successMessage: 'Offer sent — email queued',
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['recruitment'] });
    },
  });
}

export function useSendOfferWithOnboarding() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: sendOfferWithOnboarding,
    successMessage: 'Offer and onboarding form sent to candidate',
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['recruitment'] });
    },
  });
}

export function useAcceptOffer() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: acceptOffer,
    successMessage: 'Offer marked as accepted',
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['recruitment'] });
    },
  });
}

export function useRejectOffer() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: rejectOffer,
    successMessage: 'Offer marked as declined',
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['recruitment'] });
    },
  });
}

export function useStartOnboarding() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({
      candidateId,
      payload,
    }: {
      candidateId: string;
      payload: { offerLetterId: string; startDate?: string };
    }) => startOnboarding(candidateId, payload),
    successMessage: 'Onboarding started — joining instructions sent',
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['recruitment'] });
      void queryClient.invalidateQueries({
        queryKey: ['recruitment', 'onboarding', variables.candidateId],
      });
    },
  });
}

export function useIssueOnboardingPortal() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: issueOnboardingPortal,
    successMessage: 'Onboarding portal link sent',
    onSuccess: (_data, candidateId) => {
      void queryClient.invalidateQueries({ queryKey: ['recruitment', 'onboarding', candidateId] });
    },
  });
}

export function useConvertCandidate() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: convertCandidate,
    successMessage: 'Converted successfully',
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['recruitment'] });
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useSaveOnboardingDraft() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({
      candidateId,
      payload,
    }: {
      candidateId: string;
      payload: Record<string, unknown>;
    }) => saveOnboardingDraft(candidateId, payload),
    errorToast: false,
    successMessage: false,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['recruitment', 'onboarding', variables.candidateId],
      });
    },
  });
}

export function useExportCandidates() {
  return useAppMutation({
    mutationFn: exportCandidates,
    successMessage: 'Export started successfully',
  });
}

export function useUploadResume() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ candidateId, file }: { candidateId: string; file: File }) =>
      uploadResume(candidateId, file),
    errorToast: false,
    successMessage: false,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['recruitment', 'candidate', variables.candidateId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['recruitment', 'candidate', variables.candidateId, 'timeline'],
      });
    },
  });
}
