import apiClient from '@/shared/api/axios.client';
import type { ApiSuccessResponse, PaginationMeta } from '@/shared/types/api.types';
import type { ListQueryParams, MasterDataRecord } from '@/features/organization/api/organization.api';
import { normalizePaginatedItems } from '@/shared/utils/api-normalize.util';
import { assertValidEntityId } from '@/shared/utils/entity-id.util';

export interface DepartmentRecord extends MasterDataRecord {
  branchId?: string;
  branchName?: string;
  parentDepartmentId?: string;
  parentDepartmentName?: string;
  headEmployeeId?: string;
  headEmployeeName?: string;
  email?: string;
  internalNotes?: string;
  description?: string;
}

export interface DepartmentStats {
  employees: number;
  managers: number;
  projects: number;
  openPositions: number;
}

export interface DepartmentDetail extends DepartmentRecord {
  headEmployeeNumber?: string;
  employeeCount: number;
  stats: DepartmentStats;
  hierarchy: {
    ancestors: Array<{ id: string; name: string; code: string }>;
    children: Array<{ id: string; name: string; code: string; status: string }>;
  };
  employees: Array<{
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
  }>;
  projects: Array<{ id: string; name: string; code: string; status: string }>;
  auditHistory: Array<Record<string, unknown>>;
}

export interface DepartmentListParams extends ListQueryParams {
  branchId?: string;
  parentDepartmentId?: string;
  headEmployeeId?: string;
}

export async function fetchDepartmentStats(): Promise<DepartmentStats> {
  const { data } = await apiClient.get<ApiSuccessResponse<DepartmentStats>>('/api/v1/organization/departments/stats');
  return data.data;
}

export async function fetchDepartmentDetail(id: string): Promise<DepartmentDetail> {
  assertValidEntityId(id, 'Department id');
  const { data } = await apiClient.get<ApiSuccessResponse<DepartmentDetail>>(
    `/api/v1/organization/departments/${id}/detail`,
  );
  return data.data;
}

export async function listDepartments(
  params: DepartmentListParams = {},
): Promise<{ items: DepartmentRecord[]; pagination: PaginationMeta }> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<DepartmentRecord[] | { items?: DepartmentRecord[] }> & { pagination?: PaginationMeta }
  >('/api/v1/organization/entities/department', { params });

  const normalized = normalizePaginatedItems(data.data, params.pageSize ?? 20);

  return {
    items: normalized.items,
    pagination: data.pagination ?? normalized.pagination,
  };
}
