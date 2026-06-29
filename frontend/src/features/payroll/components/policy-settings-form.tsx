import { FormEvent, useEffect, useState } from 'react';
import type { PayrollPolicy } from '@/features/payroll/api/payroll.api';
import { usePayrollPolicy, useUpdatePayrollPolicy } from '@/features/payroll/hooks/use-payroll';
import { runFormMutation } from '@/shared/feedback/run-form-mutation';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';

export function PolicySettingsForm() {
  const { data: policy, isLoading } = usePayrollPolicy();
  const updatePolicy = useUpdatePayrollPolicy();

  const [form, setForm] = useState<Partial<PayrollPolicy>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (policy) {
      setForm(policy);
    }
  }, [policy]);

  if (isLoading) {
    return <Loading message="Loading payroll policy..." />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (updatePolicy.isPending) {
      return;
    }

    await runFormMutation({
      setError,
      successMessage: 'Payroll policy saved successfully.',
      mutation: () => updatePolicy.mutateAsync(form),
    });
  };

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="max-w-2xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Pay Cycle"
          value={form.payCycle ?? 'monthly'}
          options={[
            { value: 'monthly', label: 'Monthly' },
            { value: 'biweekly', label: 'Bi-weekly' },
            { value: 'weekly', label: 'Weekly' },
          ]}
          onChange={(v) => setForm({ ...form, payCycle: v as PayrollPolicy['payCycle'] })}
        />
        <NumberField
          label="Pay Day (day of month/cycle)"
          value={form.payDay ?? 1}
          onChange={(v) => setForm({ ...form, payDay: v })}
        />
        <TextField
          label="Default Currency"
          value={form.currency ?? 'INR'}
          onChange={(v) => setForm({ ...form, currency: v })}
        />
        <SelectField
          label="Rounding Mode"
          value={form.roundingMode ?? 'nearest'}
          options={[
            { value: 'nearest', label: 'Nearest' },
            { value: 'up', label: 'Round Up' },
            { value: 'down', label: 'Round Down' },
          ]}
          onChange={(v) => setForm({ ...form, roundingMode: v as PayrollPolicy['roundingMode'] })}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.proRataEnabled ?? false}
          onChange={(e) => setForm({ ...form, proRataEnabled: e.target.checked })}
        />
        Enable pro-rata calculation for mid-cycle joiners/leavers
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.taxCalculationEnabled ?? false}
          onChange={(e) => setForm({ ...form, taxCalculationEnabled: e.target.checked })}
        />
        Enable tax calculation
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.statutoryDeductionsEnabled ?? false}
          onChange={(e) => setForm({ ...form, statutoryDeductionsEnabled: e.target.checked })}
        />
        Enable statutory deductions (PF, ESI, etc.)
      </label>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" disabled={updatePolicy.isPending}>
        {updatePolicy.isPending ? 'Saving...' : 'Save Policy'}
      </Button>
    </form>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium">{label}</span>
      <input
        type="number"
        min={1}
        max={31}
        className="w-full rounded-md border p-2"
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
      <input className="w-full rounded-md border p-2" value={value} onChange={(e) => onChange(e.target.value)} />
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
      <select className="w-full rounded-md border p-2" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
