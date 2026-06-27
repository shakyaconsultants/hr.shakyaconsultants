import apiClient from '@/shared/api/axios.client';
import type { ApiSuccessResponse, PaginatedResult, PaginationMeta } from '@/shared/types/api.types';
import {
  createSetting,
  deleteSetting,
  fetchSettings,
  fetchSettingsByGroup,
  updateSetting,
  SETTING_GROUPS,
  type AppSetting,
  type SettingGroup,
  type SettingListParams,
} from '@/features/admin/api/settings.api';

export {
  createSetting,
  deleteSetting,
  fetchSettings,
  fetchSettingsByGroup,
  updateSetting,
  SETTING_GROUPS,
  type AppSetting,
  type SettingGroup,
  type SettingListParams,
};

const SETTINGS_PREFIX = '/api/v1/settings';

export interface ConfigurationSection {
  id: string;
  slug: string;
  label: string;
  description?: string;
  group: string;
  icon?: string;
  settingCount?: number;
}

export interface ConfigurationCatalogGroup {
  id: string;
  label: string;
  sections: string[];
}

export interface ConfigurationCatalog {
  sections: ConfigurationSection[];
  groups: ConfigurationCatalogGroup[];
}

export interface SettingHistoryEntry {
  id: string;
  key: string;
  oldValue: unknown;
  newValue: unknown;
  changedBy: string;
  changedByName?: string;
  changedAt: string;
  reason?: string;
}

export interface FeatureFlagDefinition {
  key: string;
  label: string;
  description?: string;
  enabled: boolean;
  category?: string;
}

export interface NavigationItemConfig {
  id: string;
  enabled: boolean;
  order: number;
  label?: string;
  icon?: string;
  portals?: string[];
  path?: string;
}

export interface NavigationConfig {
  items: NavigationItemConfig[];
  updatedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  timestamp: string;
  ip?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditListParams {
  page?: number;
  pageSize?: number;
  action?: string;
  entity?: string;
  userId?: string;
  from?: string;
  to?: string;
  search?: string;
}

export interface SystemHealthService {
  status: string;
  latencyMs?: number;
  message?: string;
}

export interface SystemHealthResponse {
  status: string;
  uptime?: number;
  version?: string;
  environment?: string;
  services: Record<string, SystemHealthService>;
  queues?: Record<string, { pending: number; failed: number; processed?: number }>;
  metrics?: Record<string, number | string>;
}

function buildFallbackCatalog(): ConfigurationCatalog {
  const sections: ConfigurationSection[] = SETTING_GROUPS.map((slug) => ({
    id: slug,
    slug,
    label: slug.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    group: 'system',
    description: `${slug} configuration settings`,
  }));

  return {
    sections,
    groups: [{ id: 'system', label: 'System', sections: [...SETTING_GROUPS] }],
  };
}

export async function fetchConfigurationSections(): Promise<ConfigurationSection[]> {
  try {
    const { data } = await apiClient.get<ApiSuccessResponse<ConfigurationSection[]>>(`${SETTINGS_PREFIX}/sections`);
    return data.data;
  } catch {
    return buildFallbackCatalog().sections;
  }
}

export async function fetchConfigurationCatalog(): Promise<ConfigurationCatalog> {
  try {
    const { data } = await apiClient.get<ApiSuccessResponse<ConfigurationCatalog>>(`${SETTINGS_PREFIX}/catalog`);
    return data.data;
  } catch {
    return buildFallbackCatalog();
  }
}

export async function seedConfigurationDefaults(section?: string): Promise<{ seeded: number }> {
  const { data } = await apiClient.post<ApiSuccessResponse<{ seeded: number }>>(
    `${SETTINGS_PREFIX}/seed-defaults`,
    section ? { section } : {},
  );
  return data.data;
}

export async function fetchSettingHistory(
  params: { key: string; page?: number; pageSize?: number },
): Promise<PaginatedResult<SettingHistoryEntry>> {
  const { data } = await apiClient.get<ApiSuccessResponse<SettingHistoryEntry[]> & { pagination?: PaginationMeta }>(
    `${SETTINGS_PREFIX}/history/${encodeURIComponent(params.key)}`,
    { params: { page: params.page, pageSize: params.pageSize } },
  );
  return {
    items: data.data,
    pagination: data.pagination ?? { page: 1, pageSize: 20, total: data.data.length, totalPages: 1 },
  };
}

export async function fetchFeatureFlagDefinitions(): Promise<FeatureFlagDefinition[]> {
  try {
    const { data } = await apiClient.get<ApiSuccessResponse<FeatureFlagDefinition[]>>(`${SETTINGS_PREFIX}/feature-flags`);
    return data.data;
  } catch {
    return [];
  }
}

export async function updateFeatureFlags(flags: Record<string, boolean>): Promise<FeatureFlagDefinition[]> {
  await Promise.all(
    Object.entries(flags).map(([flagKey, enabled]) =>
      apiClient.patch(`${SETTINGS_PREFIX}/feature-flags/${encodeURIComponent(flagKey)}`, { enabled }),
    ),
  );
  return fetchFeatureFlagDefinitions();
}

export async function fetchNavigationConfig(): Promise<NavigationConfig> {
  try {
    const { data } = await apiClient.get<ApiSuccessResponse<NavigationConfig>>(`${SETTINGS_PREFIX}/navigation`);
    return data.data;
  } catch {
    return { items: [] };
  }
}

export async function updateNavigationConfig(items: NavigationItemConfig[]): Promise<NavigationConfig> {
  const { data } = await apiClient.put<ApiSuccessResponse<NavigationConfig>>(`${SETTINGS_PREFIX}/navigation`, {
    items,
  });
  return data.data;
}

export async function fetchAuditLogs(params: AuditListParams = {}): Promise<PaginatedResult<AuditLogEntry>> {
  const { data } = await apiClient.get<ApiSuccessResponse<AuditLogEntry[]> & { pagination?: PaginationMeta }>(
    `${SETTINGS_PREFIX}/audit`,
    { params },
  );
  return {
    items: data.data,
    pagination: data.pagination ?? { page: 1, pageSize: 50, total: data.data.length, totalPages: 1 },
  };
}

export async function exportAuditLogsCsv(params: Omit<AuditListParams, 'page' | 'pageSize'> = {}): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(`${SETTINGS_PREFIX}/audit/export`, {
    params,
    responseType: 'blob',
  });
  return data;
}

export async function fetchSystemHealth(): Promise<SystemHealthResponse> {
  try {
    const { data } = await apiClient.get<ApiSuccessResponse<SystemHealthResponse>>(`${SETTINGS_PREFIX}/system/health`);
    return data.data;
  } catch {
    return { status: 'unknown', services: {} };
  }
}
