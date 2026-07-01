import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppMutation } from '@/shared/feedback/use-app-mutation';
import {
  createEmployee,
  exportEmployees,
  fetchEmployee,
  fetchEmployeeDashboard,
  fetchEmployees,
  searchEmployees,
  updateEmployee,
  uploadDocument,
  deleteEmployee,
  archiveEmployee,
  restoreEmployee,
  deactivateEmployee,
  reactivateEmployee,
  sendEmployeeActivationEmail,
  sendEmployeeOnboardingEmail,
  sendEmployeePasswordResetEmail,
  type EmployeeDashboard,
  type ListEmployeesParams,
} from '@/features/employee/api/employee.api';
import { employeeQueryKeys, refreshEmployeeQueries } from '@/features/employee/employee-query-keys';

export function useEmployees(params: ListEmployeesParams = {}) {
  return useQuery({
    queryKey: employeeQueryKeys.list(params),
    queryFn: () => fetchEmployees(params),
    refetchOnMount: true,
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: employeeQueryKeys.detail(id),
    queryFn: () => fetchEmployee(id),
    enabled: Boolean(id),
    refetchOnMount: true,
  });
}

export function useEmployeeDashboard(id: string) {
  return useQuery({
    queryKey: employeeQueryKeys.dashboard(id),
    queryFn: () => fetchEmployeeDashboard(id),
    enabled: Boolean(id),
    refetchOnMount: true,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: createEmployee,
    errorToast: false,
    successMessage: false,
    onSuccess: () => refreshEmployeeQueries(queryClient),
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => updateEmployee(id, payload),
    errorToast: false,
    successMessage: false,
    onSuccess: (_data, variables) => refreshEmployeeQueries(queryClient, variables.id),
  });
}

export function useSearchEmployees(search: string) {
  return useQuery({
    queryKey: employeeQueryKeys.search(search),
    queryFn: () => searchEmployees(search),
    enabled: search.length >= 2,
    refetchOnMount: true,
  });
}

export function useExportEmployees() {
  return useAppMutation({
    mutationFn: exportEmployees,
    successMessage: 'Export started successfully',
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ employeeId, file, documentType }: { employeeId: string; file: File; documentType: string }) =>
      uploadDocument(employeeId, file, documentType),
    errorToast: false,
    successMessage: false,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: employeeQueryKeys.dashboard(variables.employeeId) });
      void queryClient.refetchQueries({ queryKey: employeeQueryKeys.dashboard(variables.employeeId) });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: deleteEmployee,
    onSuccess: (_data, id) => refreshEmployeeQueries(queryClient, id),
  });
}

export function useArchiveEmployee() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: archiveEmployee,
    onSuccess: (_data, id) => refreshEmployeeQueries(queryClient, id),
  });
}

export function useRestoreEmployee() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: restoreEmployee,
    onSuccess: (_data, id) => refreshEmployeeQueries(queryClient, id),
  });
}

export function useDeactivateEmployee() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: deactivateEmployee,
    onSuccess: (_data, id) => refreshEmployeeQueries(queryClient, id),
  });
}

export function useReactivateEmployee() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: reactivateEmployee,
    onSuccess: (_data, id) => refreshEmployeeQueries(queryClient, id),
  });
}

function usePatchEmployeeDashboardLifecycle(employeeId: string) {
  const queryClient = useQueryClient();
  return (lifecycle: EmployeeDashboard['lifecycle']) => {
    queryClient.setQueryData<EmployeeDashboard>(employeeQueryKeys.dashboard(employeeId), (current) =>
      current ? { ...current, lifecycle } : current,
    );
    void queryClient.invalidateQueries({ queryKey: employeeQueryKeys.dashboard(employeeId) });
  };
}

export function useSendEmployeeActivationEmail(employeeId: string) {
  const patchLifecycle = usePatchEmployeeDashboardLifecycle(employeeId);
  return useAppMutation({
    mutationFn: () => sendEmployeeActivationEmail(employeeId),
    errorToast: false,
    successMessage: false,
    onSuccess: (result) => patchLifecycle(result.lifecycle),
  });
}

export function useSendEmployeeOnboardingEmail(employeeId: string) {
  const patchLifecycle = usePatchEmployeeDashboardLifecycle(employeeId);
  return useAppMutation({
    mutationFn: () => sendEmployeeOnboardingEmail(employeeId),
    errorToast: false,
    successMessage: false,
    onSuccess: (result) => patchLifecycle(result.lifecycle),
  });
}

export function useSendEmployeePasswordResetEmail(employeeId: string) {
  const patchLifecycle = usePatchEmployeeDashboardLifecycle(employeeId);
  return useAppMutation({
    mutationFn: () => sendEmployeePasswordResetEmail(employeeId),
    errorToast: false,
    successMessage: false,
    onSuccess: (result) => patchLifecycle(result.lifecycle),
  });
}
