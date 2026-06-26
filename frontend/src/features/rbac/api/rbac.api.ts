import apiClient from '@/shared/api/axios.client';
import type { ApiSuccessResponse, PaginatedResult, PaginationMeta } from '@/shared/types/api.types';

const RBAC_PREFIX = '/api/v1/rbac';

export interface RoleRecord {
  id: string;
  name: string;
  slug: string;
  description?: string;
  priority: number;
  isSystem: boolean;
  isArchived: boolean;
  status: string;
}

export interface PermissionRecord {
  id: string;
  code: string;
  name: string;
  module: string;
  category?: string;
  dependsOn: string[];
}

export interface MatrixData {
  permissions: PermissionRecord[];
  groups: Array<{ id: string; name: string; slug: string }>;
  categories: Array<{ id: string; name: string; slug: string }>;
}

export interface SimulatorResult {
  effectivePermissions: string[];
  missingDependencies: string[];
  extraFromRoles: string[];
  isSuperAdmin: boolean;
}

export async function fetchRoles(params: Record<string, string | number | undefined> = {}): Promise<PaginatedResult<RoleRecord>> {
  const { data } = await apiClient.get<ApiSuccessResponse<RoleRecord[]> & { pagination?: PaginationMeta }>(
    `${RBAC_PREFIX}/roles`,
    { params },
  );
  return {
    items: data.data,
    pagination: data.pagination ?? { page: 1, pageSize: 20, total: data.data.length, totalPages: 1 },
  };
}

export async function fetchRole(id: string): Promise<{ role: RoleRecord; permissions: string[] }> {
  const { data } = await apiClient.get<ApiSuccessResponse<{ role: RoleRecord; permissions: string[] }>>(
    `${RBAC_PREFIX}/roles/${id}`,
  );
  return data.data;
}

export async function cloneRole(id: string, name: string): Promise<RoleRecord> {
  const { data } = await apiClient.post<ApiSuccessResponse<RoleRecord>>(`${RBAC_PREFIX}/roles/${id}/clone`, { name });
  return data.data;
}

export async function fetchPermissionMatrix(): Promise<MatrixData> {
  const { data } = await apiClient.get<ApiSuccessResponse<MatrixData>>(`${RBAC_PREFIX}/matrix`);
  return data.data;
}

export async function fetchPermissions(params: Record<string, string | number | undefined> = {}): Promise<PaginatedResult<PermissionRecord>> {
  const { data } = await apiClient.get<ApiSuccessResponse<PermissionRecord[]> & { pagination?: PaginationMeta }>(
    `${RBAC_PREFIX}/permissions`,
    { params },
  );
  return {
    items: data.data,
    pagination: data.pagination ?? { page: 1, pageSize: 100, total: data.data.length, totalPages: 1 },
  };
}

export async function runSimulator(input: {
  roleIds?: string[];
  permissionCodes?: string[];
  employeeId?: string;
}): Promise<SimulatorResult> {
  const { data } = await apiClient.post<ApiSuccessResponse<SimulatorResult>>(`${RBAC_PREFIX}/simulator`, input);
  return data.data;
}

export async function compareRoles(roleIdA: string, roleIdB: string) {
  const { data } = await apiClient.post<ApiSuccessResponse<{
    onlyInA: string[];
    onlyInB: string[];
    shared: string[];
  }>>(`${RBAC_PREFIX}/roles/compare`, { roleIdA, roleIdB });
  return data.data;
}

export async function assignPermissions(roleId: string, permissionCodes: string[]) {
  const { data } = await apiClient.post(`${RBAC_PREFIX}/roles/${roleId}/permissions`, { permissionCodes });
  return data.data;
}

export interface RoleTemplateRecord {
  id: string;
  name: string;
  slug: string;
  description?: string;
  permissionCodes: string[];
  priority: number;
  isSystem: boolean;
}

export async function fetchRoleTemplates(): Promise<RoleTemplateRecord[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<RoleTemplateRecord[]>>(`${RBAC_PREFIX}/role-templates`);
  return data.data;
}

export async function createRole(payload: {
  name: string;
  slug?: string;
  description?: string;
  priority?: number;
  permissionCodes?: string[];
}): Promise<RoleRecord> {
  const { data } = await apiClient.post<ApiSuccessResponse<RoleRecord>>(`${RBAC_PREFIX}/roles`, payload);
  return data.data;
}

export async function updateRole(id: string, payload: Partial<{ name: string; description: string; priority: number; status: string }>): Promise<RoleRecord> {
  const { data } = await apiClient.patch<ApiSuccessResponse<RoleRecord>>(`${RBAC_PREFIX}/roles/${id}`, payload);
  return data.data;
}

export async function archiveRole(id: string): Promise<RoleRecord> {
  const { data } = await apiClient.post<ApiSuccessResponse<RoleRecord>>(`${RBAC_PREFIX}/roles/${id}/archive`);
  return data.data;
}

export async function restoreRole(id: string): Promise<RoleRecord> {
  const { data } = await apiClient.post<ApiSuccessResponse<RoleRecord>>(`${RBAC_PREFIX}/roles/${id}/restore`);
  return data.data;
}

export async function deleteRole(id: string): Promise<void> {
  await apiClient.delete(`${RBAC_PREFIX}/roles/${id}`);
}
