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

export function useSettings(params: SettingListParams = {}) {
  return useQuery({
    queryKey: ['settings', params],
    queryFn: () => fetchSettings(params),
  });
}

export function useSettingsGroup(group: string) {
  return useQuery({
    queryKey: ['settings', 'group', group],
    queryFn: () => fetchSettingsByGroup(group),
    enabled: Boolean(group),
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) => updateSetting(key, value),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['settings'] });
      void queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
    },
  });
}

export function useCreateSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSetting,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });
}

export function useDeleteSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSetting,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });
}

function parseFeatureFlags(settings: Array<{ key: string; value: unknown }>): FeatureFlags {
  const flags: FeatureFlags = { ...DEFAULT_FEATURE_FLAGS };
  for (const setting of settings) {
    const flagKey = setting.key.replace(/^feature\./, '');
    if (flagKey in flags) {
      flags[flagKey] = Boolean(setting.value);
    }
  }
  return flags;
}

export function useFeatureFlags() {
  return useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      try {
        const settings = await fetchSettingsByGroup('feature_flags');
        if (settings.length === 0) {
          return DEFAULT_FEATURE_FLAGS;
        }
        return parseFeatureFlags(settings);
      } catch {
        return DEFAULT_FEATURE_FLAGS;
      }
    },
    staleTime: 60_000,
  });
}
