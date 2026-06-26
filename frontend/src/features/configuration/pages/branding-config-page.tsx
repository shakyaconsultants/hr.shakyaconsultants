import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ROUTES } from '@/config/app.config';
import { ConfirmSaveDialog } from '@/features/configuration/components/confirm-save-dialog';
import {
  useConfigurationSettingsByGroup,
  useCreateConfigurationSetting,
  useUpdateConfigurationSetting,
} from '@/features/configuration/hooks/use-configuration';
import { PageHeader } from '@/shared/components/page-header';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { useAuthStore } from '@/shared/stores/app.store';

const BRANDING_KEYS = [
  { key: 'branding.logo_url', label: 'Logo URL', type: 'string' },
  { key: 'branding.primary_color', label: 'Primary Color', type: 'string', placeholder: '#2563eb' },
  { key: 'branding.accent_color', label: 'Accent Color', type: 'string', placeholder: '#7c3aed' },
  { key: 'branding.portal_title', label: 'Portal Title', type: 'string' },
  { key: 'branding.footer_text', label: 'Footer Text', type: 'string' },
  { key: 'branding.theme', label: 'Theme', type: 'string', placeholder: 'light | dark | system' },
] as const;

interface BrandingConfigPageProps {
  embedded?: boolean;
}

export function BrandingConfigPage({ embedded = false }: BrandingConfigPageProps) {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canManage = hasPermission('settings.manage');
  const { data: settings, isLoading, refetch } = useConfigurationSettingsByGroup('branding');
  const updateMutation = useUpdateConfigurationSetting();
  const createMutation = useCreateConfigurationSetting();
  const [form, setForm] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const field of BRANDING_KEYS) {
      const existing = settings?.find((s) => s.key === field.key);
      next[field.key] = String(existing?.value ?? '');
    }
    setForm(next);
    setDirty(false);
  }, [settings]);

  async function handleSave() {
    for (const field of BRANDING_KEYS) {
      const existing = settings?.find((s) => s.key === field.key);
      const value = form[field.key] ?? '';
      if (existing) {
        await updateMutation.mutateAsync({ key: field.key, value });
      } else if (value) {
        await createMutation.mutateAsync({
          key: field.key,
          value,
          valueType: field.type,
          group: 'branding',
          description: field.label,
        });
      }
    }
    setConfirmOpen(false);
    setDirty(false);
    await refetch();
  }

  const primaryColor = form['branding.primary_color'] || '#2563eb';
  const accentColor = form['branding.accent_color'] || '#7c3aed';

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
        title="Branding & Theme"
        description="Customize portal appearance, colors, and white-label identity."
      />
      {isLoading ? <Loading message="Loading branding settings..." /> : null}
      {!isLoading ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <form
            className="space-y-4 rounded-lg border bg-card p-6"
            onSubmit={(e) => {
              e.preventDefault();
              setConfirmOpen(true);
            }}
          >
            {BRANDING_KEYS.map((field) => (
              <label key={field.key} className="block space-y-1.5 text-sm">
                <span className="font-medium">{field.label}</span>
                <Input
                  value={form[field.key] ?? ''}
                  placeholder={'placeholder' in field ? field.placeholder : undefined}
                  disabled={!canManage}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, [field.key]: e.target.value }));
                    setDirty(true);
                  }}
                />
              </label>
            ))}
            {canManage ? (
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={!dirty}>
                  Save branding
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Read-only view.</p>
            )}
          </form>
          <div className="rounded-lg border bg-card p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preview</p>
            <div
              className="overflow-hidden rounded-md border"
              style={{ borderColor: primaryColor }}
            >
              <div className="px-4 py-3 text-sm font-semibold text-white" style={{ backgroundColor: primaryColor }}>
                {form['branding.portal_title'] || 'HR Shakya ERP'}
              </div>
              <div className="space-y-2 bg-background p-4 text-sm">
                {form['branding.logo_url'] ? (
                  <img src={form['branding.logo_url']} alt="Logo preview" className="h-10 object-contain" />
                ) : null}
                <div className="h-2 rounded" style={{ backgroundColor: accentColor, width: '60%' }} />
                <div className="h-2 rounded bg-muted" style={{ width: '80%' }} />
              </div>
              <div className="border-t px-4 py-2 text-xs text-muted-foreground">
                {form['branding.footer_text'] || '© Your Company'}
              </div>
            </div>
          </div>
        </div>
      ) : null}
      <ConfirmSaveDialog
        open={confirmOpen}
        changedCount={BRANDING_KEYS.length}
        isLoading={updateMutation.isPending || createMutation.isPending}
        onConfirm={() => void handleSave()}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
