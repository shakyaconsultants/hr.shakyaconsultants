import apiClient from '@/shared/api/axios.client';
import type {
  ApiSuccessResponse,
  ApiSuccessResponseWithPagination,
  PaginationMeta,
} from '@/shared/types/api.types';
import type {
  ListQueryParams,
  MasterDataRecord,
} from '@/features/organization/api/organization.api';
import { unwrapApiPaginated } from '@/shared/utils/api-normalize.util';

export interface DesignationRecord extends MasterDataRecord {
  description?: string;
  hierarchyLevel?: number;
  hierarchyLevelLabel?: string;
  salaryGradeId?: string;
  salaryGradeName?: string;
  departmentIds?: string[];
  departmentName?: string;
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
  const { data } = await apiClient.get<ApiSuccessResponseWithPagination<DesignationRecord>>(
    '/api/v1/organization/entities/designation',
    { params },
  );

  return unwrapApiPaginated<DesignationRecord>(data, params.pageSize ?? 20);
}

export async function fetchDesignationDetail(id: string): Promise<DesignationDetail> {
  const { data } = await apiClient.get<ApiSuccessResponse<DesignationDetail>>(
    `/api/v1/organization/designations/${id}/detail`,
  );
  return data.data;
}
