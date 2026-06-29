import apiClient from '@/shared/api/axios.client';
import type { ApiSuccessResponse, PaginatedResult } from '@/shared/types/api.types';
import { normalizePaginatedItems } from '@/shared/utils/api-normalize.util';

const SETTINGS_PREFIX = '/api/v1/settings';

export interface AppSetting {
  id: string;
  key: string;
  value: unknown;
  valueType: string;
  group: string;
  description?: string;
  isEditable: boolean;
  isPublic: boolean;
}

export interface SettingListParams {
  page?: number;
  pageSize?: number;
  group?: string;
  search?: string;
}

export async function fetchSettings(params: SettingListParams = {}): Promise<PaginatedResult<AppSetting>> {
  const { data } = await apiClient.get<any>(
    SETTINGS_PREFIX,
    { params },
  );
  return normalizePaginatedItems<AppSetting>(data.data, 50);
}

export async function fetchSettingsByGroup(group: string): Promise<AppSetting[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<AppSetting[]>>(`${SETTINGS_PREFIX}/group/${group}`);
  return data.data;
}

export async function updateSetting(key: string, value: unknown): Promise<AppSetting> {
  const { data } = await apiClient.patch<ApiSuccessResponse<AppSetting>>(`${SETTINGS_PREFIX}/${key}`, { value });
  return data.data;
}

export async function createSetting(payload: {
  key: string;
  value: unknown;
  valueType: string;
  group: string;
  description?: string;
  isPublic?: boolean;
}): Promise<AppSetting> {
  const { data } = await apiClient.post<ApiSuccessResponse<AppSetting>>(SETTINGS_PREFIX, payload);
  return data.data;
}

export async function deleteSetting(key: string): Promise<void> {
  await apiClient.delete(`${SETTINGS_PREFIX}/${key}`);
}

export const SETTING_GROUPS = [
  'general',
  'company',
  'branding',
  'smtp',
  'cloudinary',
  'attendance',
  'leave',
  'payroll',
  'projects',
  'recruitment',
  'security',
  'feature_flags',
  'templates',
] as const;

export type SettingGroup = (typeof SETTING_GROUPS)[number];
