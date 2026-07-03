import apiClient from '@/shared/api/axios.client';
import type { ApiSuccessResponse, PaginatedResult } from '@/shared/types/api.types';
import { normalizePaginatedItems } from '@/shared/utils/api-normalize.util';
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

const EXCLUDED_SECTIONS = new Set(['feature_flags', 'reports', 'analytics']);

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

export interface NavigationItemConfig {
  id: string;
  enabled: boolean;
  order: number;
  label?: string;
  icon?: string;
  portals?: string[];
  path?: string;
  groupId?: string;
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

interface BackendConfigurationSection {
  id: string;
  name: string;
  description?: string;
  group: string;
  settings?: unknown[];
}

interface BackendNavigationItem {
  id: string;
  label?: string;
  enabled: boolean;
  sortOrder: number;
  groupId?: string;
  icon?: string;
  portals?: string[];
  permission?: string;
}

function formatGroupLabel(groupId: string): string {
  return groupId.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizeSection(raw: BackendConfigurationSection): ConfigurationSection {
  return {
    id: raw.id,
    slug: raw.id,
    label: raw.name,
    description: raw.description,
    group: raw.group,
    settingCount: Array.isArray(raw.settings) ? raw.settings.length : undefined,
  };
}

function buildCatalogFromSections(sections: ConfigurationSection[]): ConfigurationCatalog {
  const groupMap = new Map<string, string[]>();
  for (const section of sections) {
    const list = groupMap.get(section.group) ?? [];
    list.push(section.slug);
    groupMap.set(section.group, list);
  }

  return {
    sections,
    groups: [...groupMap.entries()].map(([id, sectionSlugs]) => ({
      id,
      label: formatGroupLabel(id),
      sections: sectionSlugs,
    })),
  };
}

function buildFallbackCatalog(): ConfigurationCatalog {
  const sections: ConfigurationSection[] = SETTING_GROUPS.filter(
    (slug) => !EXCLUDED_SECTIONS.has(slug),
  ).map((slug) => ({
    id: slug,
    slug,
    label: formatGroupLabel(slug),
    group: 'system',
    description: `${formatGroupLabel(slug)} configuration settings`,
  }));

  return buildCatalogFromSections(sections);
}

function normalizeNavigationItems(raw: BackendNavigationItem[]): NavigationItemConfig[] {
  return raw.map((item) => ({
    id: item.id,
    enabled: item.enabled,
    order: item.sortOrder,
    label: item.label,
    icon: item.icon,
    portals: item.portals,
    groupId: item.groupId,
  }));
}

export async function fetchConfigurationSections(): Promise<ConfigurationSection[]> {
  try {
    const { data } = await apiClient.get<ApiSuccessResponse<BackendConfigurationSection[]>>(
      `${SETTINGS_PREFIX}/sections`,
    );
    return data.data
      .filter((section) => !EXCLUDED_SECTIONS.has(section.id))
      .map(normalizeSection);
  } catch {
    return buildFallbackCatalog().sections;
  }
}

export async function fetchConfigurationCatalog(): Promise<ConfigurationCatalog> {
  try {
    const { data } = await apiClient.get<ApiSuccessResponse<BackendConfigurationSection[]>>(
      `${SETTINGS_PREFIX}/catalog`,
    );
    const sections = data.data
      .filter((section) => !EXCLUDED_SECTIONS.has(section.id))
      .map(normalizeSection);
    return buildCatalogFromSections(sections);
  } catch {
    return buildFallbackCatalog();
  }
}

export async function seedConfigurationDefaults(section?: string): Promise<{ seeded: number }> {
  const { data } = await apiClient.post<
    ApiSuccessResponse<{ created: number; skipped: number; updated: number }>
  >(`${SETTINGS_PREFIX}/seed-defaults`, section ? { section } : {});
  const result = data.data;
  return { seeded: result.created + result.updated };
}

export async function fetchSettingHistory(
  params: { key: string; page?: number; pageSize?: number },
): Promise<PaginatedResult<SettingHistoryEntry>> {
  const { data } = await apiClient.get<any>(
    `${SETTINGS_PREFIX}/history/${encodeURIComponent(params.key)}`,
    { params: { page: params.page, pageSize: params.pageSize } },
  );
  return normalizePaginatedItems<SettingHistoryEntry>(data.data);
}

export async function fetchNavigationConfig(): Promise<NavigationConfig> {
  try {
    const { data } = await apiClient.get<ApiSuccessResponse<BackendNavigationItem[]>>(
      `${SETTINGS_PREFIX}/navigation`,
    );
    return { items: normalizeNavigationItems(data.data) };
  } catch {
    return { items: [] };
  }
}

export async function updateNavigationConfig(items: NavigationItemConfig[]): Promise<NavigationConfig> {
  const { data } = await apiClient.put<ApiSuccessResponse<BackendNavigationItem[]>>(
    `${SETTINGS_PREFIX}/navigation`,
    {
      overrides: items.map((item) => ({
        id: item.id,
        enabled: item.enabled,
        sortOrder: item.order,
        groupId: item.groupId ?? 'core',
        icon: item.icon,
        portals: item.portals,
      })),
    },
  );
  return { items: normalizeNavigationItems(data.data) };
}

export async function fetchAuditLogs(params: AuditListParams = {}): Promise<PaginatedResult<AuditLogEntry>> {
  const { data } = await apiClient.get<any>(
    `${SETTINGS_PREFIX}/audit`,
    { params },
  );
  return normalizePaginatedItems<AuditLogEntry>(data.data, 50);
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
    const { data } = await apiClient.get<ApiSuccessResponse<SystemHealthResponse>>(
      `${SETTINGS_PREFIX}/system/health`,
    );
    const payload = data.data;
    return {
      status: payload.status ?? 'unknown',
      uptime: payload.uptime,
      version: payload.version,
      environment: payload.environment,
      services: payload.services ?? {},
      queues: payload.queues,
      metrics: payload.metrics,
    };
  } catch {
    return { status: 'unknown', services: {} };
  }
}
