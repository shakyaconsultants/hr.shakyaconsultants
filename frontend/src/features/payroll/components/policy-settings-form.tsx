import { FormEvent, useEffect, useState } from 'react';
import type { PayrollPolicy } from '@/features/payroll/api/payroll.api';
import {
  DEFAULT_STATUTORY_PLUGINS,
  mergeStatutoryPlugins,
  type StatutoryPluginConfig,
} from '@/features/payroll/constants/payroll-policy.constants';
import { usePayrollPolicy, useUpdatePayrollPolicy } from '@/features/payroll/hooks/use-payroll';
import { runFormMutation } from '@/shared/feedback/run-form-mutation';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';

export function PolicySettingsForm() {
  const { data: policy, isLoading } = usePayrollPolicy();
  const updatePolicy = useUpdatePayrollPolicy();

  const [form, setForm] = useState<PayrollPolicy>({
    calendarStartDay: 1,
    lockAfterDays: 7,
    approvalWorkflowSlug: 'payroll-run-default',
    revisionWorkflowSlug: 'salary-revision-default',
    statutoryPlugins: DEFAULT_STATUTORY_PLUGINS,
    overtimeRateMultiplier: 1.5,
    lwpDeductionBasis: 'daily',
    companyDisplayName: '',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (policy) {
      setForm({
        ...policy,
        statutoryPlugins: mergeStatutoryPlugins(policy.statutoryPlugins),
      });
    }
  }, [policy]);

  if (isLoading) {
    return <Loading message="Loading payroll policy..." />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (updatePolicy.isPending) return;

    await runFormMutation({
      setError,
      successMessage: 'Payroll policy saved successfully.',
      mutation: () => updatePolicy.mutateAsync(form),
    });
  };

  const togglePlugin = (pluginId: string, enabled: boolean) => {
    setForm((prev) => ({
      ...prev,
      statutoryPlugins: prev.statutoryPlugins.map((plugin) =>
        plugin.pluginId === pluginId ? { ...plugin, enabled } : plugin,
      ),
    }));
  };

  const updatePluginRate = (pluginId: string, field: 'employeeRate' | 'employerRate', value: number) => {
    setForm((prev) => ({
      ...prev,
      statutoryPlugins: prev.statutoryPlugins.map((plugin) =>
        plugin.pluginId === pluginId
          ? { ...plugin, config: { ...plugin.config, [field]: value } }
          : plugin,
      ),
    }));
  };

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Payroll cycle</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NumberField
            label="Calendar start day (1–28)"
            value={form.calendarStartDay}
            onChange={(v) => setForm({ ...form, calendarStartDay: v })}
            min={1}
            max={28}
          />
          <NumberField
            label="Lock payroll after (days)"
            value={form.lockAfterDays}
            onChange={(v) => setForm({ ...form, lockAfterDays: v })}
            min={0}
            max={31}
          />
          <NumberField
            label="Overtime rate multiplier"
            value={form.overtimeRateMultiplier}
            onChange={(v) => setForm({ ...form, overtimeRateMultiplier: v })}
            min={0}
            max={5}
            step={0.1}
          />
          <TextField
            label="Company name on payslips"
            value={form.companyDisplayName}
            onChange={(v) => setForm({ ...form, companyDisplayName: v })}
          />
          <SelectField
            label="Loss-of-pay deduction basis"
            value={form.lwpDeductionBasis}
            options={[
              { value: 'daily', label: 'Daily rate' },
              { value: 'monthly', label: 'Monthly proration' },
            ]}
            onChange={(v) => setForm({ ...form, lwpDeductionBasis: v })}
          />
          <TextField
            label="Payroll approval workflow slug"
            value={form.approvalWorkflowSlug}
            onChange={(v) => setForm({ ...form, approvalWorkflowSlug: v })}
          />
          <TextField
            label="Salary revision workflow slug"
            value={form.revisionWorkflowSlug}
            onChange={(v) => setForm({ ...form, revisionWorkflowSlug: v })}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Statutory deductions & employer contributions
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Toggle each component on or off. Rates apply as a percentage of basic or gross salary unless noted.
          </p>
        </div>
        <div className="space-y-3">
          {form.statutoryPlugins.map((plugin) => (
            <StatutoryPluginRow
              key={plugin.pluginId}
              plugin={plugin}
              onToggle={(enabled) => togglePlugin(plugin.pluginId, enabled)}
              onRateChange={(field, value) => updatePluginRate(plugin.pluginId, field, value)}
            />
          ))}
        </div>
      </section>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" disabled={updatePolicy.isPending}>
        {updatePolicy.isPending ? 'Saving...' : 'Save Payroll Policy'}
      </Button>
    </form>
  );
}

function StatutoryPluginRow({
  plugin,
  onToggle,
  onRateChange,
}: {
  plugin: StatutoryPluginConfig;
  onToggle: (enabled: boolean) => void;
  onRateChange: (field: 'employeeRate' | 'employerRate', value: number) => void;
}) {
  const name = String(plugin.config.name ?? plugin.pluginId);
  const employeeRate = Number(plugin.config.employeeRate ?? plugin.config.rate ?? 0);
  const employerRate = Number(plugin.config.employerRate ?? 0);

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-colors',
        plugin.enabled ? 'border-primary/30 bg-primary/5' : 'bg-muted/20',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">
            Basis: {String(plugin.config.basis ?? 'gross')}
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border"
            checked={plugin.enabled}
            onChange={(e) => onToggle(e.target.checked)}
          />
          {plugin.enabled ? 'Enabled' : 'Disabled'}
        </label>
      </div>
      {plugin.enabled ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <NumberField
            label="Employee rate (%)"
            value={employeeRate}
            onChange={(v) => onRateChange('employeeRate', v)}
            min={0}
            max={100}
            step={0.01}
          />
          <NumberField
            label="Employer rate (%)"
            value={employerRate}
            onChange={(v) => onRateChange('employerRate', v)}
            min={0}
            max={100}
            step={0.01}
          />
        </div>
      ) : null}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        className="w-full rounded-md border bg-background p-2"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium">{label}</span>
      <input
        className="w-full rounded-md border bg-background p-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium">{label}</span>
      <select
        className="w-full rounded-md border bg-background p-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
