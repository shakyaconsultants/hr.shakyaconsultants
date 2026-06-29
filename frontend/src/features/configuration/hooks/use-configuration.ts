import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppMutation } from '@/shared/feedback/use-app-mutation';
import { DEFAULT_FEATURE_FLAGS, type FeatureFlags } from '@/config/module-registry';
import { ON_DEMAND_QUERY_OPTIONS, MASTER_DATA_QUERY_OPTIONS } from '@/shared/api/query-config';
import { queryKeys } from '@/shared/api/query-keys';
import { useAuthStore } from '@/shared/stores/app.store';
import {
  exportAuditLogsCsv,
  fetchAuditLogs,
  fetchConfigurationCatalog,
  fetchConfigurationSections,
  fetchFeatureFlagDefinitions,
  fetchNavigationConfig,
  fetchSettingHistory,
  fetchSettings,
  fetchSettingsByGroup,
  fetchSystemHealth,
  seedConfigurationDefaults,
  updateFeatureFlags,
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
    enabled: Boolean(group),
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
      void queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
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

function parseFeatureFlagsFromDefinitions(
  definitions: Array<{ key: string; enabled: boolean }>,
): FeatureFlags {
  const flags: FeatureFlags = { ...DEFAULT_FEATURE_FLAGS };
  for (const def of definitions) {
    const flagKey = def.key.replace(/^feature\./, '');
    if (flagKey in flags) {
      flags[flagKey] = Boolean(def.enabled);
    } else {
      flags[flagKey] = Boolean(def.enabled);
    }
  }
  return flags;
}

export function useConfigurationFeatureFlags() {
  const queryClient = useQueryClient();
  const setSessionFeatureFlags = useAuthStore((s) => s.setSessionFeatureFlags);
  const query = useQuery({
    queryKey: [...CONFIG_QUERY_KEY, 'feature-flags'],
    queryFn: async () => {
      const definitions = await fetchFeatureFlagDefinitions();
      if (definitions.length === 0) {
        const settings = await fetchSettingsByGroup('feature_flags');
        if (settings.length === 0) return DEFAULT_FEATURE_FLAGS;
        const flags: FeatureFlags = { ...DEFAULT_FEATURE_FLAGS };
        for (const setting of settings) {
          const flagKey = setting.key.replace(/^feature\./, '');
          flags[flagKey] = Boolean(setting.value);
        }
        return flags;
      }
      return parseFeatureFlagsFromDefinitions(definitions);
    },
    ...MASTER_DATA_QUERY_OPTIONS,
  });

  const mutation = useAppMutation({
    mutationFn: (flags: Record<string, boolean>) => updateFeatureFlags(flags),
    errorToast: false,
    successMessage: false,
    onSuccess: (_data, variables) => {
      setSessionFeatureFlags({ ...DEFAULT_FEATURE_FLAGS, ...variables } as FeatureFlags);
      void queryClient.invalidateQueries({ queryKey: [...CONFIG_QUERY_KEY, 'feature-flags'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.featureFlags });
    },
  });

  return { ...query, updateFlags: mutation };
}

export function useFeatureFlagDefinitions() {
  return useQuery({
    queryKey: [...CONFIG_QUERY_KEY, 'feature-flag-definitions'],
    queryFn: fetchFeatureFlagDefinitions,
    ...MASTER_DATA_QUERY_OPTIONS,
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
