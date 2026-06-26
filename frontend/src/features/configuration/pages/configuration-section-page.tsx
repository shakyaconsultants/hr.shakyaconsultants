import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, History, RotateCcw } from 'lucide-react';
import { ROUTES } from '@/config/app.config';
import type { AppSetting } from '@/features/configuration/api/configuration.api';
import { ConfirmSaveDialog } from '@/features/configuration/components/confirm-save-dialog';
import { ConfigurationSidebar } from '@/features/configuration/components/configuration-sidebar';
import { SettingFieldEditor } from '@/features/configuration/components/setting-field-editor';
import { SettingHistoryPanel } from '@/features/configuration/components/setting-history-panel';
import { BrandingConfigPage } from '@/features/configuration/pages/branding-config-page';
import { CompanyConfigPage } from '@/features/configuration/pages/company-config-page';
import { FeatureManagementPage } from '@/features/configuration/pages/feature-management-page';
import {
  useConfigurationCatalog,
  useConfigurationSettingsByGroup,
  useSeedConfigurationDefaults,
  useUpdateConfigurationSetting,
} from '@/features/configuration/hooks/use-configuration';
import { PageHeader } from '@/shared/components/page-header';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';
import { useAuthStore } from '@/shared/stores/app.store';

const SPECIAL_SECTIONS = new Set(['company', 'branding', 'feature_flags']);

export function ConfigurationSectionPage() {
  const { section = '' } = useParams<{ section: string }>();
  const [search, setSearch] = useState('');
  const [drafts, setDrafts] = useState<Record<string, unknown>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [historyKey, setHistoryKey] = useState<string | null>(null);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canManage = hasPermission('settings.manage');

  const { data: catalog } = useConfigurationCatalog();
  const { data: settings, isLoading, isError, refetch } = useConfigurationSettingsByGroup(section);
  const updateMutation = useUpdateConfigurationSetting();
  const seedMutation = useSeedConfigurationDefaults();

  const sectionMeta = catalog?.sections.find((s) => s.slug === section);

  useEffect(() => {
    setDrafts({});
  }, [section]);

  const changedKeys = useMemo(() => {
    if (!settings) return [];
    return settings
      .filter((s) => drafts[s.key] !== undefined && JSON.stringify(drafts[s.key]) !== JSON.stringify(s.value))
      .map((s) => s.key);
  }, [settings, drafts]);

  if (SPECIAL_SECTIONS.has(section)) {
    if (section === 'company') return <CompanyConfigPage embedded />;
    if (section === 'branding') return <BrandingConfigPage embedded />;
    if (section === 'feature_flags') return <FeatureManagementPage embedded />;
  }

  async function handleSave() {
    for (const key of changedKeys) {
      await updateMutation.mutateAsync({ key, value: drafts[key] });
    }
    setDrafts({});
    setConfirmOpen(false);
    await refetch();
  }

  function getDraftValue(setting: AppSetting): unknown {
    return drafts[setting.key] !== undefined ? drafts[setting.key] : setting.value;
  }

  const groupedSettings = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = (settings ?? []).filter(
      (s) =>
        !q ||
        s.key.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q),
    );
    const groups = new Map<string, AppSetting[]>();
    for (const setting of filtered) {
      const groupKey = setting.group || section;
      const list = groups.get(groupKey) ?? [];
      list.push(setting);
      groups.set(groupKey, list);
    }
    return groups;
  }, [settings, search, section]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to={ROUTES.CONFIGURATION}
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Configuration Hub
          </Link>
          <PageHeader
            title={sectionMeta?.label ?? section.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            description={sectionMeta?.description ?? `Manage ${section} settings for your organization.`}
          />
        </div>
        {canManage ? (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={seedMutation.isPending}
              onClick={() => void seedMutation.mutateAsync(section)}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Seed defaults
            </Button>
            <Button
              size="sm"
              disabled={changedKeys.length === 0 || updateMutation.isPending}
              onClick={() => setConfirmOpen(true)}
            >
              Save {changedKeys.length > 0 ? `(${changedKeys.length})` : 'changes'}
            </Button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <ConfigurationSidebar
          catalog={catalog}
          activeSection={section}
          search={search}
          onSearchChange={setSearch}
        />
        <div className="min-w-0 flex-1">
          {isLoading ? <Loading message="Loading settings..." /> : null}
          {isError ? <p className="text-destructive">Failed to load settings for this section.</p> : null}
          {!isLoading && !isError && (settings?.length ?? 0) === 0 ? (
            <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
              No settings in this section yet.
              {canManage ? (
                <div className="mt-4">
                  <Button variant="outline" onClick={() => void seedMutation.mutateAsync(section)}>
                    Seed default settings
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-6">
            {[...groupedSettings.entries()].map(([groupKey, groupSettings]) => (
              <section key={groupKey} className="rounded-lg border bg-card">
                <div className="border-b px-4 py-3">
                  <h3 className="font-semibold capitalize">{groupKey.replace(/_/g, ' ')}</h3>
                </div>
                <ul className="divide-y">
                  {groupSettings.map((setting) => (
                    <li key={setting.key} className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] md:items-start">
                      <div>
                        <p className="font-mono text-sm font-medium">{setting.key}</p>
                        {setting.description ? (
                          <p className="mt-1 text-sm text-muted-foreground">{setting.description}</p>
                        ) : null}
                        <p className="mt-1 text-xs text-muted-foreground">{setting.valueType}</p>
                      </div>
                      <SettingFieldEditor
                        setting={setting}
                        value={getDraftValue(setting)}
                        disabled={!canManage}
                        onChange={(value) => setDrafts((prev) => ({ ...prev, [setting.key]: value }))}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setHistoryKey(setting.key)}
                        aria-label={`History for ${setting.key}`}
                      >
                        <History className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </div>

      <ConfirmSaveDialog
        open={confirmOpen}
        changedCount={changedKeys.length}
        isLoading={updateMutation.isPending}
        onConfirm={() => void handleSave()}
        onCancel={() => setConfirmOpen(false)}
      />
      <SettingHistoryPanel settingKey={historyKey} onClose={() => setHistoryKey(null)} />
    </div>
  );
}
