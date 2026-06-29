import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppMutation } from '@/shared/feedback/use-app-mutation';
import {
  applyLeave,
  completeExitItem,
  fetchCompanyCalendar,
  fetchExitProcess,
  fetchLeaveBalances,
  fetchLeaveCalendar,
  fetchLeavePolicies,
  fetchLeaveRequests,
  fetchResignations,
  submitResignation,
  withdrawLeave,
  withdrawResignation,
  type ApplyLeavePayload,
  type ListLeaveParams,
  type SubmitResignationPayload,
} from '@/features/leave-exit/api/leave-exit.api';

export function useLeavePolicies() {
  return useQuery({
    queryKey: ['leave-exit', 'policies'],
    queryFn: fetchLeavePolicies,
  });
}

export function useLeaveBalances(employeeId?: string, year?: number) {
  return useQuery({
    queryKey: ['leave-exit', 'balances', employeeId, year],
    queryFn: () => fetchLeaveBalances(employeeId, year),
  });
}

export function useLeaveRequests(params: ListLeaveParams = {}) {
  return useQuery({
    queryKey: ['leave-exit', 'leave-requests', params],
    queryFn: () => fetchLeaveRequests(params),
  });
}

export function useLeaveCalendar(startDate: string, endDate: string, employeeId?: string) {
  return useQuery({
    queryKey: ['leave-exit', 'leave-calendar', startDate, endDate, employeeId],
    queryFn: () => fetchLeaveCalendar(startDate, endDate, employeeId),
    enabled: Boolean(startDate && endDate),
  });
}

export function useCompanyCalendar(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['leave-exit', 'company-calendar', startDate, endDate],
    queryFn: () => fetchCompanyCalendar(startDate, endDate),
    enabled: Boolean(startDate && endDate),
  });
}

export function useResignations(employeeId?: string) {
  return useQuery({
    queryKey: ['leave-exit', 'resignations', employeeId],
    queryFn: () => fetchResignations(employeeId),
  });
}

export function useExitProcess(id: string) {
  return useQuery({
    queryKey: ['leave-exit', 'exit-process', id],
    queryFn: () => fetchExitProcess(id),
    enabled: Boolean(id),
  });
}

export function useApplyLeave() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (payload: ApplyLeavePayload) => applyLeave(payload),
    errorToast: false,
    successMessage: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['leave-exit'] });
      void queryClient.invalidateQueries({ queryKey: ['approval'] });
    },
  });
}

export function useWithdrawLeave() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (id: string) => withdrawLeave(id),
    successMessage: 'Withdrawn successfully',
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['leave-exit'] });
      void queryClient.invalidateQueries({ queryKey: ['approval'] });
    },
  });
}

export function useSubmitResignation() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (payload: SubmitResignationPayload) => submitResignation(payload),
    errorToast: false,
    successMessage: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['leave-exit'] });
      void queryClient.invalidateQueries({ queryKey: ['approval'] });
    },
  });
}

export function useWithdrawResignation() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (id: string) => withdrawResignation(id),
    successMessage: 'Withdrawn successfully',
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['leave-exit'] });
    },
  });
}

export function useCompleteExitItem() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => completeExitItem(id, notes),
    successMessage: 'Completed successfully',
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['leave-exit'] });
    },
  });
}
