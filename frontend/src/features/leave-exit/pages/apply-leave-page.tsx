import { FormEvent, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { LeaveExitNav, LeaveExitPageHeader } from '@/features/leave-exit/components/leave-exit-nav';
import { useApplyLeave, useLeavePolicies } from '@/features/leave-exit/hooks/use-leave-exit';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';
import { ROUTES } from '@/config/app.config';

export function ApplyLeavePage() {
  const navigate = useNavigate();
  const { data: policies, isLoading } = useLeavePolicies();
  const applyLeave = useApplyLeave();

  const [employeeId, setEmployeeId] = useState('');
  const [leavePolicyId, setLeavePolicyId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [durationType, setDurationType] = useState('full_day');
  const [reason, setReason] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await applyLeave.mutateAsync({
        employeeId,
        leavePolicyId,
        startDate,
        endDate,
        durationType,
        reason,
        isEmergency,
        submit: true,
      });
      navigate(ROUTES.LEAVE_REQUESTS);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to apply leave');
    }
  };

  if (isLoading) return <Loading message="Loading leave policies..." />;

  return (
    <div className="space-y-6">
      <LeaveExitPageHeader title="Apply Leave" description="Submit a leave request for approval." />
      <LeaveExitNav />

      <form onSubmit={(e) => void onSubmit(e)} className="max-w-xl space-y-4 rounded-lg border p-6">
        <Field label="Employee ID" required>
          <input className="w-full rounded-md border p-2 text-sm" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required />
        </Field>

        <Field label="Leave Policy" required>
          <select className="w-full rounded-md border p-2 text-sm" value={leavePolicyId} onChange={(e) => setLeavePolicyId(e.target.value)} required>
            <option value="">Select policy</option>
            {(policies ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Start Date" required>
            <input type="date" className="w-full rounded-md border p-2 text-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </Field>
          <Field label="End Date" required>
            <input type="date" className="w-full rounded-md border p-2 text-sm" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          </Field>
        </div>

        <Field label="Duration Type" required>
          <select className="w-full rounded-md border p-2 text-sm" value={durationType} onChange={(e) => setDurationType(e.target.value)}>
            <option value="full_day">Full Day</option>
            <option value="half_day">Half Day</option>
            <option value="multi_day">Multi Day</option>
          </select>
        </Field>

        <Field label="Reason" required>
          <textarea className="w-full rounded-md border p-2 text-sm" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} required />
        </Field>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isEmergency} onChange={(e) => setIsEmergency(e.target.checked)} />
          Emergency leave
        </label>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button type="submit" disabled={applyLeave.isPending}>
          {applyLeave.isPending ? 'Submitting...' : 'Submit for Approval'}
        </Button>
      </form>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
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
