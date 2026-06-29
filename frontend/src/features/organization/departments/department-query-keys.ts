import type { DepartmentListParams } from '@/features/organization/departments/department.api';

export const departmentQueryKeys = {
  all: ['organization', 'department'] as const,
  lists: () => [...departmentQueryKeys.all, 'list'] as const,
  list: (params: DepartmentListParams) => [...departmentQueryKeys.lists(), params] as const,
  stats: () => [...departmentQueryKeys.all, 'stats'] as const,
  details: () => [...departmentQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...departmentQueryKeys.details(), id] as const,
};
