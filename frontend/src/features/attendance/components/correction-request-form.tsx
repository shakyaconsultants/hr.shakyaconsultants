import { FormEvent, useState } from 'react';
import { useCreateCorrection } from '@/features/attendance/hooks/use-attendance';
import { Button } from '@/shared/components/ui/button';

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
  { value: 'half_day', label: 'Half Day' },
  { value: 'on_leave', label: 'On Leave' },
] as const;

interface CorrectionRequestFormProps {
  attendanceId: string;
  currentStatus?: string;
  onSuccess?: () => void;
}

export function CorrectionRequestForm({ attendanceId, currentStatus, onSuccess }: CorrectionRequestFormProps) {
  const createCorrection = useCreateCorrection();
  const [adjustedStatus, setAdjustedStatus] = useState('present');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await createCorrection.mutateAsync({
        attendanceId,
        adjustedStatus,
        reason,
        submit: true,
      });
      setReason('');
      onSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit correction request');
    }
  };

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-4 rounded-lg border p-4">
      <h3 className="font-semibold">Request Attendance Correction</h3>

      {currentStatus ? (
        <p className="text-sm text-muted-foreground">
          Current status: <span className="font-medium capitalize">{currentStatus.replace(/_/g, ' ')}</span>
        </p>
      ) : null}

      <Field label="Requested Status" required>
        <select
          className="w-full rounded-md border p-2 text-sm"
          value={adjustedStatus}
          onChange={(e) => setAdjustedStatus(e.target.value)}
          required
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Reason" required>
        <textarea
          className="w-full rounded-md border p-2 text-sm"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why this correction is needed..."
          required
        />
      </Field>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" disabled={createCorrection.isPending}>
        {createCorrection.isPending ? 'Submitting...' : 'Submit for Approval'}
      </Button>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium">
        {label}
        {required ? ' *' : ''}
      </span>
      {children}
    </label>
  );
}
