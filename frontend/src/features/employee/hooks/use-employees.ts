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

export function useEmployees(params: ListEmployeesParams = {}) {
  return useQuery({
    queryKey: ['employees', params],
    queryFn: () => fetchEmployees(params),
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: () => fetchEmployee(id),
    enabled: Boolean(id),
  });
}

export function useEmployeeDashboard(id: string) {
  return useQuery({
    queryKey: ['employee', id, 'dashboard'],
    queryFn: () => fetchEmployeeDashboard(id),
    enabled: Boolean(id),
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: createEmployee,
    errorToast: false,
    successMessage: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => updateEmployee(id, payload),
    errorToast: false,
    successMessage: false,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
      void queryClient.invalidateQueries({ queryKey: ['employee', variables.id] });
      void queryClient.invalidateQueries({ queryKey: ['employee', variables.id, 'dashboard'] });
    },
  });
}

export function useSearchEmployees(search: string) {
  return useQuery({
    queryKey: ['employees', 'search', search],
    queryFn: () => searchEmployees(search),
    enabled: search.length >= 2,
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
      void queryClient.invalidateQueries({ queryKey: ['employee', variables.employeeId, 'dashboard'] });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useArchiveEmployee() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: archiveEmployee,
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
      void queryClient.invalidateQueries({ queryKey: ['employee', id] });
      void queryClient.invalidateQueries({ queryKey: ['employee', id, 'dashboard'] });
    },
  });
}

export function useRestoreEmployee() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: restoreEmployee,
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
      void queryClient.invalidateQueries({ queryKey: ['employee', id] });
      void queryClient.invalidateQueries({ queryKey: ['employee', id, 'dashboard'] });
    },
  });
}

export function useDeactivateEmployee() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: deactivateEmployee,
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
      void queryClient.invalidateQueries({ queryKey: ['employee', id] });
      void queryClient.invalidateQueries({ queryKey: ['employee', id, 'dashboard'] });
    },
  });
}

export function useReactivateEmployee() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: reactivateEmployee,
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
      void queryClient.invalidateQueries({ queryKey: ['employee', id] });
      void queryClient.invalidateQueries({ queryKey: ['employee', id, 'dashboard'] });
    },
  });
}

function usePatchEmployeeDashboardLifecycle(employeeId: string) {
  const queryClient = useQueryClient();
  return (lifecycle: EmployeeDashboard['lifecycle']) => {
    queryClient.setQueryData<EmployeeDashboard>(['employee', employeeId, 'dashboard'], (current) =>
      current ? { ...current, lifecycle } : current,
    );
    void queryClient.invalidateQueries({ queryKey: ['employee', employeeId, 'dashboard'] });
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
