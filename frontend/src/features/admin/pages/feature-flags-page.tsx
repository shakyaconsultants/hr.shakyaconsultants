import { DEFAULT_FEATURE_FLAGS } from '@/config/module-registry';
import { useCreateSetting, useFeatureFlags, useSettingsGroup, useUpdateSetting } from '@/features/admin/hooks/use-settings';
import { PageHeader } from '@/shared/components/page-header';
import { Loading } from '@/shared/components/loading';
import { useAuthStore } from '@/shared/stores/app.store';

export function FeatureFlagsPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const { data: flags, isLoading } = useFeatureFlags({ fetchFresh: true });
  const { data: settings } = useSettingsGroup('feature_flags');
  const updateMutation = useUpdateSetting();
  const createMutation = useCreateSetting();

  async function toggleFlag(key: string, enabled: boolean) {
    const settingKey = `feature.${key}`;
    const existing = settings?.find((s) => s.key === settingKey);
    if (existing) {
      await updateMutation.mutateAsync({ key: settingKey, value: enabled });
      return;
    }
    await createMutation.mutateAsync({
      key: settingKey,
      value: enabled,
      valueType: 'boolean',
      group: 'feature_flags',
      description: `Feature flag for ${key}`,
    });
  }

  if (isLoading) return <Loading message="Loading feature flags..." />;

  const activeFlags = flags ?? DEFAULT_FEATURE_FLAGS;

  return (
    <div className="space-y-6">
      <PageHeader title="Feature Management" description="Enable or disable modules — disabled modules disappear from navigation automatically." />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(activeFlags).map(([key, enabled]) => (
          <label key={key} className="flex items-center justify-between rounded-lg border bg-card p-4 text-sm">
            <span className="font-medium capitalize">{key.replace(/_/g, ' ')}</span>
            {hasPermission('settings.manage') ? (
              <input type="checkbox" checked={Boolean(enabled)} onChange={(e) => void toggleFlag(key, e.target.checked)} />
            ) : (
              <span className="text-muted-foreground">{enabled ? 'On' : 'Off'}</span>
            )}
          </label>
        ))}
      </div>
      {!hasPermission('settings.manage') ? <p className="text-sm text-muted-foreground">Read-only view.</p> : null}
    </div>
  );
}
