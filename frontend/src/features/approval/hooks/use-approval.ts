import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppMutation } from '@/shared/feedback/use-app-mutation';
import {
  approveRequest,
  bulkApproveRequests,
  fetchApprovalHistory,
  fetchApprovalInbox,
  fetchApprovalRequests,
  fetchWorkflows,
  createWorkflow,
  updateWorkflow,
  rejectRequest,
  type ApprovalListParams,
} from '@/features/approval/api/approval.api';

export function useApprovalInbox(params: ApprovalListParams = {}) {
  return useQuery({
    queryKey: ['approval', 'inbox', params],
    queryFn: () => fetchApprovalInbox(params),
  });
}

export function useApprovalRequests(params: ApprovalListParams = {}) {
  return useQuery({
    queryKey: ['approval', 'requests', params],
    queryFn: () => fetchApprovalRequests(params),
  });
}

export function useApprovalHistory(id: string) {
  return useQuery({
    queryKey: ['approval', 'history', id],
    queryFn: () => fetchApprovalHistory(id),
    enabled: Boolean(id),
  });
}

export function useWorkflows(requestType?: string) {
  return useQuery({
    queryKey: ['approval', 'workflows', requestType],
    queryFn: () => fetchWorkflows(requestType),
  });
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: createWorkflow,
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['approval', 'workflows'] }),
  });
}

export function useUpdateWorkflow() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateWorkflow>[1] }) =>
      updateWorkflow(id, payload),
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['approval', 'workflows'] }),
  });
}

export function useApproveRequest() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ id, comments }: { id: string; comments?: string }) => approveRequest(id, comments),
    successMessage: 'Approved successfully',
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['approval'] });
      void queryClient.invalidateQueries({ queryKey: ['leave-exit'] });
    },
  });
}

export function useRejectRequest() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ id, comments }: { id: string; comments?: string }) => rejectRequest(id, comments),
    successMessage: 'Rejected successfully',
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['approval'] });
      void queryClient.invalidateQueries({ queryKey: ['leave-exit'] });
    },
  });
}

export function useBulkApprove() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ requestIds, comments }: { requestIds: string[]; comments?: string }) =>
      bulkApproveRequests(requestIds, comments),
    successMessage: 'Approved successfully',
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['approval'] });
      void queryClient.invalidateQueries({ queryKey: ['leave-exit'] });
    },
  });
}
