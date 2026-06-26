import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DEFAULT_FEATURE_FLAGS, type FeatureFlags } from '@/config/module-registry';
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
    queryKey: [...CONFIG_QUERY_KEY, 'catalog'],
    queryFn: fetchConfigurationCatalog,
    staleTime: 60_000,
  });
}

export function useConfigurationSections() {
  return useQuery({
    queryKey: [...CONFIG_QUERY_KEY, 'sections'],
    queryFn: fetchConfigurationSections,
    staleTime: 60_000,
  });
}

export function useConfigurationSettings(params: SettingListParams = {}) {
  return useQuery({
    queryKey: [...CONFIG_QUERY_KEY, 'settings', params],
    queryFn: () => fetchSettings(params),
  });
}

export function useConfigurationSettingsByGroup(group: string) {
  return useQuery({
    queryKey: [...CONFIG_QUERY_KEY, 'settings', 'group', group],
    queryFn: () => fetchSettingsByGroup(group),
    enabled: Boolean(group),
  });
}

export function useSettingHistory(params: { key?: string; page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: [...CONFIG_QUERY_KEY, 'history', params],
    queryFn: () => fetchSettingHistory(params),
    enabled: Boolean(params.key),
  });
}

export function useUpdateConfigurationSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) => updateSetting(key, value),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CONFIG_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['settings'] });
      void queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
    },
  });
}

export function useCreateConfigurationSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSetting,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: CONFIG_QUERY_KEY }),
  });
}

export function useDeleteConfigurationSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSetting,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: CONFIG_QUERY_KEY }),
  });
}

export function useSeedConfigurationDefaults() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (section?: string) => seedConfigurationDefaults(section),
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
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: (flags: Record<string, boolean>) => updateFeatureFlags(flags),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...CONFIG_QUERY_KEY, 'feature-flags'] });
      void queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      void queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  return { ...query, updateFlags: mutation };
}

export function useFeatureFlagDefinitions() {
  return useQuery({
    queryKey: [...CONFIG_QUERY_KEY, 'feature-flag-definitions'],
    queryFn: fetchFeatureFlagDefinitions,
  });
}

export function useNavigationConfig() {
  return useQuery({
    queryKey: [...CONFIG_QUERY_KEY, 'navigation'],
    queryFn: fetchNavigationConfig,
    staleTime: 60_000,
  });
}

export function useUpdateNavigationConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: NavigationItemConfig[]) => updateNavigationConfig(items),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...CONFIG_QUERY_KEY, 'navigation'] });
      void queryClient.invalidateQueries({ queryKey: ['navigation-config'] });
    },
  });
}

export function useAuditLogs(params: AuditListParams = {}) {
  return useQuery({
    queryKey: [...CONFIG_QUERY_KEY, 'audit', params],
    queryFn: () => fetchAuditLogs(params),
  });
}

export function useExportAuditLogs() {
  return useMutation({
    mutationFn: (params: Omit<AuditListParams, 'page' | 'pageSize'>) => exportAuditLogsCsv(params),
  });
}

export function useSystemHealth() {
  return useQuery({
    queryKey: [...CONFIG_QUERY_KEY, 'system-health'],
    queryFn: fetchSystemHealth,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}
