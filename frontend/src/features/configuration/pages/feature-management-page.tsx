import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { DEFAULT_FEATURE_FLAGS } from '@/config/module-registry';
import { ROUTES } from '@/config/app.config';
import {
  useConfigurationFeatureFlags,
  useCreateConfigurationSetting,
  useUpdateConfigurationSetting,
} from '@/features/configuration/hooks/use-configuration';
import { PageHeader } from '@/shared/components/page-header';
import { Loading } from '@/shared/components/loading';
import { useAuthStore } from '@/shared/stores/app.store';

interface FeatureManagementPageProps {
  embedded?: boolean;
}

export function FeatureManagementPage({ embedded = false }: FeatureManagementPageProps) {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canManage = hasPermission('settings.manage');
  const { data: flags, isLoading, updateFlags } = useConfigurationFeatureFlags();
  const updateMutation = useUpdateConfigurationSetting();
  const createMutation = useCreateConfigurationSetting();

  const activeFlags = flags ?? DEFAULT_FEATURE_FLAGS;

  const sortedEntries = useMemo(
    () => Object.entries(activeFlags).sort(([a], [b]) => a.localeCompare(b)),
    [activeFlags],
  );

  async function toggleFlag(key: string, enabled: boolean) {
    if (updateFlags) {
      try {
        await updateFlags.mutateAsync({ [key]: enabled });
        return;
      } catch {
        // fall through to settings CRUD
      }
    }

    const settingKey = `feature.${key}`;
    try {
      await updateMutation.mutateAsync({ key: settingKey, value: enabled });
    } catch {
      await createMutation.mutateAsync({
        key: settingKey,
        value: enabled,
        valueType: 'boolean',
        group: 'feature_flags',
        description: `Feature flag for ${key}`,
      });
    }
  }

  const isPending = updateFlags?.isPending || updateMutation.isPending || createMutation.isPending;

  return (
    <div className="space-y-6">
      {!embedded ? (
        <Link
          to={ROUTES.CONFIGURATION}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Configuration Hub
        </Link>
      ) : null}
      <PageHeader
        title="Feature Management"
        description="Enable or disable platform modules — disabled modules disappear from navigation automatically."
      />
      {isLoading ? <Loading message="Loading feature flags..." /> : null}
      {!isLoading ? (
        <>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {sortedEntries.map(([key, enabled]) => (
              <label
                key={key}
                className="flex items-center justify-between rounded-lg border bg-card p-4 text-sm transition-colors hover:border-primary/30"
              >
                <div>
                  <span className="font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                  <p className="mt-0.5 text-xs text-muted-foreground font-mono">feature.{key}</p>
                </div>
                {canManage ? (
                  <input
                    type="checkbox"
                    checked={Boolean(enabled)}
                    disabled={isPending}
                    onChange={(e) => void toggleFlag(key, e.target.checked)}
                    className="h-4 w-4"
                  />
                ) : (
                  <span className={enabled ? 'text-green-600' : 'text-muted-foreground'}>
                    {enabled ? 'On' : 'Off'}
                  </span>
                )}
              </label>
            ))}
          </div>
          {!canManage ? <p className="text-sm text-muted-foreground">Read-only view.</p> : null}
        </>
      ) : null}
    </div>
  );
}
