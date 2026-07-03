import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppMutation } from '@/shared/feedback/use-app-mutation';
import { ON_DEMAND_QUERY_OPTIONS, MASTER_DATA_QUERY_OPTIONS } from '@/shared/api/query-config';
import { queryKeys } from '@/shared/api/query-keys';
import { useAuthStore } from '@/shared/stores/app.store';
import {
  exportAuditLogsCsv,
  fetchAuditLogs,
  fetchConfigurationCatalog,
  fetchConfigurationSections,
  fetchNavigationConfig,
  fetchSettingHistory,
  fetchSettings,
  fetchSettingsByGroup,
  fetchSystemHealth,
  seedConfigurationDefaults,
  updateNavigationConfig,
  updateSetting,
  createSetting,
  deleteSetting,
  type AuditListParams,
  type NavigationItemConfig,
  type SettingListParams,
} from '@/features/configuration/api/configuration.api';

const CONFIG_QUERY_KEY = ['configuration'] as const;

export function useConfigurationCatalog() {
  return useQuery({
    queryKey: queryKeys.configuration.catalog,
    queryFn: fetchConfigurationCatalog,
    ...MASTER_DATA_QUERY_OPTIONS,
  });
}

export function useConfigurationSections() {
  return useQuery({
    queryKey: queryKeys.configuration.sections,
    queryFn: fetchConfigurationSections,
    ...MASTER_DATA_QUERY_OPTIONS,
  });
}

export function useConfigurationSettings(params: SettingListParams = {}) {
  return useQuery({
    queryKey: queryKeys.configuration.settings(params as Record<string, unknown>),
    queryFn: () => fetchSettings(params),
    ...ON_DEMAND_QUERY_OPTIONS,
  });
}

export function useConfigurationSettingsByGroup(group: string) {
  return useQuery({
    queryKey: [...CONFIG_QUERY_KEY, 'settings', 'group', group],
    queryFn: () => fetchSettingsByGroup(group),
    enabled: Boolean(group) && !['feature_flags', 'reports', 'analytics'].includes(group),
    ...MASTER_DATA_QUERY_OPTIONS,
  });
}

export function useSettingHistory(params: { key: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: [...CONFIG_QUERY_KEY, 'history', params],
    queryFn: () => fetchSettingHistory(params),
    enabled: Boolean(params.key),
    ...ON_DEMAND_QUERY_OPTIONS,
  });
}

export function useUpdateConfigurationSetting() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) => updateSetting(key, value),
    errorToast: false,
    successMessage: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CONFIG_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

export function useCreateConfigurationSetting() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: createSetting,
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: CONFIG_QUERY_KEY }),
  });
}

export function useDeleteConfigurationSetting() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: deleteSetting,
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: CONFIG_QUERY_KEY }),
  });
}

export function useSeedConfigurationDefaults() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (section?: string) => seedConfigurationDefaults(section),
    successMessage: 'Defaults seeded successfully',
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: CONFIG_QUERY_KEY }),
  });
}

export function useNavigationConfig(options?: { fetchFresh?: boolean }) {
  const sessionNavigation = useAuthStore((s) => s.navigation);
  const useSessionSeed = !options?.fetchFresh && sessionNavigation.length > 0;

  return useQuery({
    queryKey: queryKeys.configuration.navigation,
    queryFn: fetchNavigationConfig,
    initialData: useSessionSeed ? { items: sessionNavigation } : undefined,
    ...MASTER_DATA_QUERY_OPTIONS,
  });
}

export function useUpdateNavigationConfig() {
  const queryClient = useQueryClient();
  const setSessionNavigation = useAuthStore((s) => s.setSessionNavigation);

  return useAppMutation({
    mutationFn: (items: NavigationItemConfig[]) => updateNavigationConfig(items),
    errorToast: false,
    successMessage: false,
    onSuccess: (data) => {
      setSessionNavigation(
        data.items.map((item) => ({
          id: item.id,
          enabled: item.enabled,
          order: item.order,
          label: item.label,
          icon: item.icon,
          portals: item.portals,
          path: item.path,
        })),
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.configuration.navigation });
    },
  });
}

export function useAuditLogs(params: AuditListParams = {}) {
  return useQuery({
    queryKey: queryKeys.configuration.audit(params as Record<string, unknown>),
    queryFn: () => fetchAuditLogs(params),
    ...ON_DEMAND_QUERY_OPTIONS,
  });
}

export function useExportAuditLogs() {
  return useAppMutation({
    mutationFn: (params: Omit<AuditListParams, 'page' | 'pageSize'>) => exportAuditLogsCsv(params),
    successMessage: 'Export started successfully',
  });
}

export function useSystemHealth() {
  return useQuery({
    queryKey: queryKeys.configuration.systemHealth,
    queryFn: fetchSystemHealth,
    ...ON_DEMAND_QUERY_OPTIONS,
  });
}
