import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createEmployee,
  exportEmployees,
  fetchEmployee,
  fetchEmployeeDashboard,
  fetchEmployees,
  searchEmployees,
  updateEmployee,
  uploadDocument,
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
  return useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => updateEmployee(id, payload),
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
  return useMutation({
    mutationFn: exportEmployees,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, file, documentType }: { employeeId: string; file: File; documentType: string }) =>
      uploadDocument(employeeId, file, documentType),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['employee', variables.employeeId, 'dashboard'] });
    },
  });
}
