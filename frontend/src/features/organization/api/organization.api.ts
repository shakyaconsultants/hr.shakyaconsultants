import apiClient from '@/shared/api/axios.client';
import type { ApiSuccessResponse, PaginationMeta } from '@/shared/types/api.types';
import type { MasterEntityKey } from '@/features/organization/constants/entity-catalog';
import { clampMasterDataListParams } from '@/features/organization/constants/master-data.constants';
import { normalizePaginatedItems } from '@/shared/utils/api-normalize.util';
import { assertValidEntityId } from '@/shared/utils/entity-id.util';

const ORG_PREFIX = '/api/v1/organization';

export interface MasterDataRecord {
  id: string;
  name: string;
  code: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  employeeCount?: number;
  [key: string]: unknown;
}

export interface ListQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeDeleted?: boolean;
  branchId?: string;
  parentDepartmentId?: string;
  headEmployeeId?: string;
}

export async function listEntities(
  entityKey: MasterEntityKey,
  params: ListQueryParams = {},
): Promise<{ items: MasterDataRecord[]; pagination: PaginationMeta }> {
  const safeParams = clampMasterDataListParams(params);
  const { data } = await apiClient.get<
    ApiSuccessResponse<MasterDataRecord[] | { items?: MasterDataRecord[] }> & {
      pagination?: PaginationMeta;
    }
  >(`${ORG_PREFIX}/entities/${entityKey}`, { params: safeParams });

  const normalized = normalizePaginatedItems(data.data, safeParams.pageSize ?? 20);

  return {
    items: normalized.items,
    pagination: data.pagination ?? normalized.pagination,
  };
}

/** Load all pages of a master-data entity (respects backend max page size of 100). */
export async function fetchAllEntities(
  entityKey: MasterEntityKey,
  params: Omit<ListQueryParams, 'page' | 'pageSize'> = {},
): Promise<MasterDataRecord[]> {
  const items: MasterDataRecord[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const result = await listEntities(entityKey, { ...params, page, pageSize: 100 });
    items.push(...result.items);
    totalPages = result.pagination?.totalPages ?? 1;
    page += 1;
  }

  return items;
}

export async function getEntity(entityKey: MasterEntityKey, id: string): Promise<MasterDataRecord> {
  assertValidEntityId(id, 'Entity id');
  const { data } = await apiClient.get<ApiSuccessResponse<MasterDataRecord>>(
    `${ORG_PREFIX}/entities/${entityKey}/${id}`,
  );
  return data.data;
}

export async function createEntity(
  entityKey: MasterEntityKey,
  payload: Record<string, unknown>,
): Promise<MasterDataRecord> {
  const { data } = await apiClient.post<ApiSuccessResponse<MasterDataRecord>>(
    `${ORG_PREFIX}/entities/${entityKey}`,
    { data: payload },
  );
  return data.data;
}

export async function updateEntity(
  entityKey: MasterEntityKey,
  id: string,
  payload: Record<string, unknown>,
): Promise<MasterDataRecord> {
  assertValidEntityId(id, 'Entity id');
  const { data } = await apiClient.patch<ApiSuccessResponse<MasterDataRecord>>(
    `${ORG_PREFIX}/entities/${entityKey}/${id}`,
    { data: payload },
  );
  return data.data;
}

export async function deleteEntity(entityKey: MasterEntityKey, id: string): Promise<void> {
  assertValidEntityId(id, 'Entity id');
  await apiClient.delete(`${ORG_PREFIX}/entities/${entityKey}/${id}`);
}

export async function restoreEntity(
  entityKey: MasterEntityKey,
  id: string,
): Promise<MasterDataRecord> {
  assertValidEntityId(id, 'Entity id');
  const { data } = await apiClient.post<ApiSuccessResponse<MasterDataRecord>>(
    `${ORG_PREFIX}/entities/${entityKey}/${id}/restore`,
  );
  return data.data;
}

export async function getCompany(): Promise<Record<string, unknown>> {
  const { data } = await apiClient.get<ApiSuccessResponse<Record<string, unknown>>>(
    `${ORG_PREFIX}/company`,
  );
  return data.data;
}

export async function updateCompany(
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const { data } = await apiClient.patch<ApiSuccessResponse<Record<string, unknown>>>(
    `${ORG_PREFIX}/company`,
    payload,
  );
  return data.data;
}

export async function exportEntities(entityKey: MasterEntityKey): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(`${ORG_PREFIX}/export/${entityKey}`, {
    responseType: 'blob',
  });
  return data;
}

export async function bulkDeleteEntities(
  entityKey: MasterEntityKey,
  ids: string[],
): Promise<{ deleted: number }> {
  const { data } = await apiClient.delete<ApiSuccessResponse<{ deleted: number }>>(
    `${ORG_PREFIX}/bulk/${entityKey}`,
    {
      data: { ids },
    },
  );
  return data.data;
}

export async function importEntitiesCsv(
  entityKey: MasterEntityKey,
  csv: string,
): Promise<{ imported: number; errors: string[] }> {
  const { data } = await apiClient.post<ApiSuccessResponse<{ imported: number; errors: string[] }>>(
    `${ORG_PREFIX}/import/${entityKey}`,
    { csv },
  );
  return data.data;
}
