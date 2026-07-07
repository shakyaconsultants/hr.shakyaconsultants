import type { QueryClient } from '@tanstack/react-query';
import { invalidateAndRefetch } from '@/shared/api/query-config';
import type { ListEmployeesParams } from '@/features/employee/api/employee.api';

export const employeeQueryKeys = {
  all: ['employees'] as const,
  list: (params: ListEmployeesParams = {}) => ['employees', params] as const,
  detail: (id: string) => ['employee', id] as const,
  dashboard: (id: string) => ['employee', id, 'dashboard'] as const,
  search: (search: string) => ['employees', 'search', search] as const,
};

/** Invalidate and refetch employee list caches so the directory updates without a full page reload. */
export async function refreshEmployeeQueries(
  queryClient: QueryClient,
  employeeId?: string,
): Promise<void> {
  await invalidateAndRefetch(queryClient, employeeQueryKeys.all);
  if (employeeId) {
    await invalidateAndRefetch(queryClient, employeeQueryKeys.detail(employeeId));
    await invalidateAndRefetch(queryClient, employeeQueryKeys.dashboard(employeeId));
  }
}
