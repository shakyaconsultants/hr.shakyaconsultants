import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createSetting,
  deleteSetting,
  fetchSettings,
  fetchSettingsByGroup,
  updateSetting,
  type SettingListParams,
} from '@/features/admin/api/settings.api';
import { DEFAULT_FEATURE_FLAGS, type FeatureFlags } from '@/config/module-registry';
import { ON_DEMAND_QUERY_OPTIONS, MASTER_DATA_QUERY_OPTIONS } from '@/shared/api/query-config';
import { queryKeys } from '@/shared/api/query-keys';
import { useAuthStore } from '@/shared/stores/app.store';

export function useSettings(params: SettingListParams = {}) {
  return useQuery({
    queryKey: queryKeys.settings.list(params as Record<string, unknown>),
    queryFn: () => fetchSettings(params),
    ...ON_DEMAND_QUERY_OPTIONS,
  });
}

export function useSettingsGroup(group: string) {
  return useQuery({
    queryKey: queryKeys.settings.group(group),
    queryFn: () => fetchSettingsByGroup(group),
    enabled: Boolean(group),
    ...MASTER_DATA_QUERY_OPTIONS,
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();
  const setSessionFeatureFlags = useAuthStore((s) => s.setSessionFeatureFlags);
  const sessionFlags = useAuthStore((s) => s.featureFlags);

  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) => updateSetting(key, value),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.settings.root });
      if (variables.key.startsWith('feature.')) {
        const flagKey = variables.key.replace(/^feature\./, '');
        setSessionFeatureFlags({
          ...(Object.keys(sessionFlags).length > 0 ? sessionFlags : DEFAULT_FEATURE_FLAGS),
          [flagKey]: Boolean(variables.value),
        } as FeatureFlags);
        void queryClient.invalidateQueries({ queryKey: queryKeys.featureFlags });
      }
    },
  });
}

export function useCreateSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSetting,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.settings.root }),
  });
}

export function useDeleteSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSetting,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.settings.root }),
  });
}

function parseFeatureFlags(settings: Array<{ key: string; value: unknown }>): FeatureFlags {
  const flags: FeatureFlags = { ...DEFAULT_FEATURE_FLAGS };
  for (const setting of settings) {
    const flagKey = setting.key.replace(/^feature\./, '');
    flags[flagKey] = Boolean(setting.value);
  }
  return flags;
}

/** Session flags by default; network fetch only when `fetchFresh: true` (e.g. admin config page). */
export function useFeatureFlags(options?: { fetchFresh?: boolean }) {
  const sessionFlags = useAuthStore((s) => s.featureFlags);
  const hasSessionFlags = Object.keys(sessionFlags).length > 0;

  return useQuery({
    queryKey: queryKeys.featureFlags,
    queryFn: async () => {
      const settings = await fetchSettingsByGroup('feature_flags');
      if (settings.length === 0) {
        return DEFAULT_FEATURE_FLAGS;
      }
      return parseFeatureFlags(settings);
    },
    enabled: options?.fetchFresh === true,
    initialData: hasSessionFlags ? sessionFlags : DEFAULT_FEATURE_FLAGS,
    ...MASTER_DATA_QUERY_OPTIONS,
  });
}
