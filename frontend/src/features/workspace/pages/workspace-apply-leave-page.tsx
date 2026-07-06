import { FormEvent, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { WorkspaceLeaveNav } from '@/features/workspace/components/workspace-leave-nav';
import { WorkspacePageHeader } from '@/features/workspace/components/workspace-nav';
import { useApplyLeave, useLeavePolicies } from '@/features/leave-exit/hooks/use-leave-exit';
import { runFormMutation } from '@/shared/feedback/run-form-mutation';
import { DatePicker } from '@/shared/components/date-picker';
import { compareDates } from '@/shared/utils/datetime';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';
import { Select } from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { ROUTES } from '@/config/app.config';
import { useAuthStore, selectLinkedEmployeeId } from '@/shared/stores/app.store';

export function WorkspaceApplyLeavePage() {
  const navigate = useNavigate();
  const employeeId = useAuthStore(selectLinkedEmployeeId) ?? '';
  const { data: policies, isLoading } = useLeavePolicies();
  const applyLeave = useApplyLeave();

  const [leavePolicyId, setLeavePolicyId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [durationType, setDurationType] = useState('full_day');
  const [reason, setReason] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateRangeError = useMemo(
    () =>
      startDate && endDate && compareDates(endDate, startDate) < 0
        ? 'End date cannot be before start date.'
        : null,
    [startDate, endDate],
  );

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!employeeId) {
      setError('Your employee profile is not linked to this account.');
      return;
    }
    if (dateRangeError) {
      setError(dateRangeError);
      return;
    }
    if (applyLeave.isPending) {
      return;
    }

    await runFormMutation({
      setError,
      successMessage: 'Leave request submitted for approval.',
      mutation: () =>
        applyLeave.mutateAsync({
          employeeId,
          leavePolicyId,
          startDate,
          endDate,
          durationType,
          reason,
          isEmergency,
          submit: true,
        }),
      onSuccess: () => navigate(ROUTES.WORKSPACE_LEAVE_REQUESTS),
    });
  };

  if (isLoading) return <Loading message="Loading leave policies..." />;

  return (
    <div className="space-y-6">
      <WorkspacePageHeader
        title="Leave & Time Off"
        description="Apply for leave, track requests, view balance, or submit resignation."
      />
      <WorkspaceLeaveNav />

      {!employeeId ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Your account is not linked to an employee record. Contact HR to apply for leave.
        </p>
      ) : (
        <form
          onSubmit={(e) => void onSubmit(e)}
          className="max-w-xl space-y-4 rounded-lg border bg-card p-6"
        >
          <Field label="Leave Policy" required>
            <Select
              value={leavePolicyId}
              onChange={(e) => setLeavePolicyId(e.target.value)}
              required
            >
              <option value="">Select policy</option>
              {(policies ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Start Date" required>
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                max={endDate || undefined}
                required
              />
            </Field>
            <Field label="End Date" required error={dateRangeError ?? undefined}>
              <DatePicker
                value={endDate}
                onChange={setEndDate}
                min={startDate || undefined}
                required
                error={dateRangeError ?? undefined}
              />
            </Field>
          </div>

          <Field label="Duration Type" required>
            <Select value={durationType} onChange={(e) => setDurationType(e.target.value)}>
              <option value="full_day">Full Day</option>
              <option value="half_day">Half Day</option>
              <option value="multi_day">Multi Day</option>
            </Select>
          </Field>

          <Field label="Reason" required>
            <Textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </Field>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isEmergency}
              onChange={(e) => setIsEmergency(e.target.checked)}
            />
            Emergency leave
          </label>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" disabled={applyLeave.isPending}>
            {applyLeave.isPending ? 'Submitting...' : 'Submit for Approval'}
          </Button>
        </form>
      )}
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium">
        {label}
        {required ? ' *' : ''}
      </span>
      {children}
      {error ? <span className="block text-xs text-destructive">{error}</span> : null}
    </label>
  );
}
