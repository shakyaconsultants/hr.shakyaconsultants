import { FormEvent, useEffect, useState } from 'react';
import type { AttendancePolicy } from '@/features/attendance/api/attendance.api';
import { useAttendancePolicy, useUpdateAttendancePolicy } from '@/features/attendance/hooks/use-attendance';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';

const WEEKDAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export function PolicySettingsForm() {
  const { data: policy, isLoading } = useAttendancePolicy();
  const updatePolicy = useUpdateAttendancePolicy();

  const [form, setForm] = useState<Partial<AttendancePolicy>>({});
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (policy) {
      setForm(policy);
    }
  }, [policy]);

  if (isLoading) {
    return <Loading message="Loading attendance policy..." />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaved(false);
    try {
      await updatePolicy.mutateAsync(form);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update policy');
    }
  };

  const toggleWeeklyOff = (day: number) => {
    const current = form.weeklyOffDays ?? [];
    const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day];
    setForm({ ...form, weeklyOffDays: next.sort() });
  };

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="max-w-2xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          label="Grace Period (minutes)"
          value={form.gracePeriodMinutes ?? 0}
          onChange={(v) => setForm({ ...form, gracePeriodMinutes: v })}
        />
        <NumberField
          label="Late Threshold (minutes)"
          value={form.lateThresholdMinutes ?? 0}
          onChange={(v) => setForm({ ...form, lateThresholdMinutes: v })}
        />
        <NumberField
          label="Early Exit Threshold (minutes)"
          value={form.earlyExitThresholdMinutes ?? 0}
          onChange={(v) => setForm({ ...form, earlyExitThresholdMinutes: v })}
        />
        <NumberField
          label="Half Day Threshold (minutes)"
          value={form.halfDayThresholdMinutes ?? 0}
          onChange={(v) => setForm({ ...form, halfDayThresholdMinutes: v })}
        />
        <NumberField
          label="Auto Mark Absent After (minutes)"
          value={form.autoMarkAbsentAfterMinutes ?? 0}
          onChange={(v) => setForm({ ...form, autoMarkAbsentAfterMinutes: v })}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.overtimeEnabled ?? false}
          onChange={(e) => setForm({ ...form, overtimeEnabled: e.target.checked })}
        />
        Enable overtime tracking
      </label>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Weekly Off Days</legend>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((day) => (
            <label key={day.value} className="flex items-center gap-1.5 rounded border px-3 py-1.5 text-sm">
              <input
                type="checkbox"
                checked={(form.weeklyOffDays ?? []).includes(day.value)}
                onChange={() => toggleWeeklyOff(day.value)}
              />
              {day.label}
            </label>
          ))}
        </div>
      </fieldset>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {saved ? <p className="text-sm text-emerald-600">Policy saved successfully.</p> : null}

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
        min={0}
        className="w-full rounded-md border p-2"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
