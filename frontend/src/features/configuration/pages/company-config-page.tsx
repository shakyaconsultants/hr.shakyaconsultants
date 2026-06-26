import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { ROUTES } from '@/config/app.config';
import { getCompany, updateCompany } from '@/features/organization/api/organization.api';
import {
  useConfigurationSettingsByGroup,
  useUpdateConfigurationSetting,
} from '@/features/configuration/hooks/use-configuration';
import { ConfirmSaveDialog } from '@/features/configuration/components/confirm-save-dialog';
import { PageHeader } from '@/shared/components/page-header';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { useAuthStore } from '@/shared/stores/app.store';

interface CompanyConfigPageProps {
  embedded?: boolean;
}

export function CompanyConfigPage({ embedded = false }: CompanyConfigPageProps) {
  const queryClient = useQueryClient();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canManage = hasPermission('settings.manage') && hasPermission('company.update');

  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ['organization', 'company'],
    queryFn: getCompany,
  });
  const { data: settings, isLoading: settingsLoading } = useConfigurationSettingsByGroup('company');
  const updateSetting = useUpdateConfigurationSetting();

  const [form, setForm] = useState({
    name: '',
    code: '',
    logoUrl: '',
    timezone: '',
    currency: '',
    address: '',
    gst: '',
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!company && !settings) return;
    const settingMap = Object.fromEntries((settings ?? []).map((s) => [s.key, s.value]));
    setForm({
      name: String(company?.name ?? settingMap['company.name'] ?? ''),
      code: String(company?.code ?? settingMap['company.code'] ?? ''),
      logoUrl: String(settingMap['company.logo_url'] ?? company?.logoUrl ?? ''),
      timezone: String(settingMap['company.timezone'] ?? company?.timezone ?? 'Asia/Kolkata'),
      currency: String(settingMap['company.currency'] ?? company?.currency ?? 'INR'),
      address: String(settingMap['company.address'] ?? company?.address ?? ''),
      gst: String(settingMap['company.gst'] ?? company?.gst ?? ''),
    });
    setDirty(false);
  }, [company, settings]);

  const companyMutation = useMutation({
    mutationFn: updateCompany,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['organization', 'company'] }),
  });

  async function handleSave() {
    await companyMutation.mutateAsync({
      name: form.name,
      code: form.code,
      timezone: form.timezone,
      currency: form.currency,
      address: form.address,
      gst: form.gst,
      logoUrl: form.logoUrl,
    });

    const settingUpdates: Array<{ key: string; value: unknown }> = [
      { key: 'company.name', value: form.name },
      { key: 'company.timezone', value: form.timezone },
      { key: 'company.currency', value: form.currency },
      { key: 'company.address', value: form.address },
      { key: 'company.gst', value: form.gst },
      { key: 'company.logo_url', value: form.logoUrl },
    ];

    for (const item of settingUpdates) {
      const existing = settings?.find((s) => s.key === item.key);
      if (existing) {
        await updateSetting.mutateAsync(item);
      }
    }

    setConfirmOpen(false);
    setDirty(false);
  }

  function updateField<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  const isLoading = companyLoading || settingsLoading;
  const isSaving = companyMutation.isPending || updateSetting.isPending;

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
        title="Company Configuration"
        description="Legal identity, regional defaults, and tax registration for your organization."
      />
      {isLoading ? <Loading message="Loading company profile..." /> : null}
      {!isLoading ? (
        <form
          className="mx-auto max-w-2xl space-y-4 rounded-lg border bg-card p-6"
          onSubmit={(e) => {
            e.preventDefault();
            setConfirmOpen(true);
          }}
        >
          <Field label="Company Name" required>
            <Input value={form.name} disabled={!canManage} onChange={(e) => updateField('name', e.target.value)} />
          </Field>
          <Field label="Company Code">
            <Input value={form.code} disabled={!canManage} onChange={(e) => updateField('code', e.target.value)} />
          </Field>
          <Field label="Logo URL">
            <Input value={form.logoUrl} disabled={!canManage} onChange={(e) => updateField('logoUrl', e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Timezone">
              <Input value={form.timezone} disabled={!canManage} onChange={(e) => updateField('timezone', e.target.value)} />
            </Field>
            <Field label="Currency">
              <Input value={form.currency} disabled={!canManage} onChange={(e) => updateField('currency', e.target.value)} />
            </Field>
          </div>
          <Field label="Registered Address">
            <textarea
              className="min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={form.address}
              disabled={!canManage}
              onChange={(e) => updateField('address', e.target.value)}
            />
          </Field>
          <Field label="GST / Tax ID">
            <Input value={form.gst} disabled={!canManage} onChange={(e) => updateField('gst', e.target.value)} />
          </Field>
          {canManage ? (
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={!dirty || isSaving}>
                Save company profile
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Read-only view — requires settings.manage and company.update.</p>
          )}
        </form>
      ) : null}
      <ConfirmSaveDialog
        open={confirmOpen}
        changedCount={1}
        isLoading={isSaving}
        onConfirm={() => void handleSave()}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
