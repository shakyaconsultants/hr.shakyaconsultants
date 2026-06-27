import apiClient from '@/shared/api/axios.client';
import type { ApiSuccessResponse, PaginationMeta } from '@/shared/types/api.types';
import type { ListQueryParams, MasterDataRecord } from '@/features/organization/api/organization.api';

export interface DesignationRecord extends MasterDataRecord {
  description?: string;
  hierarchyLevel?: number;
  hierarchyLevelLabel?: string;
  salaryGradeId?: string;
  salaryGradeName?: string;
  departmentId?: string;
  departmentName?: string;
  applicableJobRoleIds?: string[];
  applicableJobRoleNames?: string[];
  applicableJobRoles?: Array<{ id: string; name: string; code: string; fullTitle: string }>;
  promotionDesignationId?: string;
  employeeCount?: number;
}

export interface DesignationDetail extends DesignationRecord {
  promotionDesignationName?: string;
  employees: Array<{
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
    jobRoleId?: string;
    fullTitle: string;
  }>;
  auditHistory: Array<Record<string, unknown>>;
}

export interface DesignationListParams extends ListQueryParams {
  departmentId?: string;
  salaryGradeId?: string;
  hierarchyLevel?: number;
}

export async function listDesignations(
  params: DesignationListParams = {},
): Promise<{ items: DesignationRecord[]; pagination: PaginationMeta }> {
  const { data } = await apiClient.get<ApiSuccessResponse<DesignationRecord[]> & { pagination?: PaginationMeta }>(
    '/api/v1/organization/entities/designation',
    { params },
  );

  return {
    items: data.data,
    pagination: data.pagination ?? {
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      total: data.data.length,
      totalPages: 1,
    },
  };
}

export async function fetchDesignationDetail(id: string): Promise<DesignationDetail> {
  const { data } = await apiClient.get<ApiSuccessResponse<DesignationDetail>>(
    `/api/v1/organization/designations/${id}/detail`,
  );
  return data.data;
}
