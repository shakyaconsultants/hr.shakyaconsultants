import { FormEvent, useEffect, useState } from 'react';
import type { SalesPolicy } from '@/features/sales/api/sales.api';
import { useSalesPolicy, useUpdateSalesPolicy } from '@/features/sales/hooks/use-sales';
import { runFormMutation } from '@/shared/feedback/run-form-mutation';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';

export function SalesPolicyForm() {
  const { data: policy, isLoading } = useSalesPolicy();
  const updatePolicy = useUpdateSalesPolicy();

  const [form, setForm] = useState<Partial<SalesPolicy>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (policy) {
      setForm(policy);
    }
  }, [policy]);

  if (isLoading) {
    return <Loading message="Loading sales policy..." />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (updatePolicy.isPending) {
      return;
    }

    await runFormMutation({
      setError,
      successMessage: 'Sales policy saved successfully.',
      mutation: () => updatePolicy.mutateAsync(form),
    });
  };

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="max-w-2xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Default Currency"
          value={form.currency ?? 'INR'}
          onChange={(v) => setForm({ ...form, currency: v })}
        />
        <NumberField
          label="Follow-up Reminder (days)"
          value={form.followUpReminderDays ?? 3}
          onChange={(v) => setForm({ ...form, followUpReminderDays: v })}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.autoAssignEnabled ?? false}
          onChange={(e) => setForm({ ...form, autoAssignEnabled: e.target.checked })}
        />
        Enable automatic lead assignment
      </label>

      <label className="block space-y-1 text-sm">
        <span className="font-medium">Default Pipeline ID</span>
        <input
          className="w-full rounded-md border p-2"
          value={form.defaultPipelineId ?? ''}
          onChange={(e) => setForm({ ...form, defaultPipelineId: e.target.value || undefined })}
          placeholder="Pipeline ID for new leads"
        />
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
