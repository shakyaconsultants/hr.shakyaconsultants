import { FormEvent, useState } from 'react';
import { LeaveExitNav, LeaveExitPageHeader, StatusBadge } from '@/features/leave-exit/components/leave-exit-nav';
import { useResignations, useSubmitResignation, useWithdrawResignation } from '@/features/leave-exit/hooks/use-leave-exit';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';

export function ResignationPage() {
  const { data, isLoading } = useResignations();
  const submit = useSubmitResignation();
  const withdraw = useWithdrawResignation();

  const [employeeId, setEmployeeId] = useState('');
  const [reason, setReason] = useState('');
  const [noticePeriodDays, setNoticePeriodDays] = useState(30);
  const [expectedLastWorkingDay, setExpectedLastWorkingDay] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await submit.mutateAsync({ employeeId, reason, noticePeriodDays, expectedLastWorkingDay });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit resignation');
    }
  };

  if (isLoading) return <Loading message="Loading resignations..." />;

  return (
    <div className="space-y-6">
      <LeaveExitPageHeader title="Resignation" description="Submit resignation and track approval workflow." />
      <LeaveExitNav />

      <form onSubmit={(e) => void onSubmit(e)} className="max-w-xl space-y-4 rounded-lg border p-6">
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Employee ID *</span>
          <input className="w-full rounded-md border p-2" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Reason *</span>
          <textarea className="w-full rounded-md border p-2" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} required />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Notice Period (days) *</span>
          <input type="number" min={0} className="w-full rounded-md border p-2" value={noticePeriodDays} onChange={(e) => setNoticePeriodDays(Number(e.target.value))} required />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Expected Last Working Day *</span>
          <input type="date" className="w-full rounded-md border p-2" value={expectedLastWorkingDay} onChange={(e) => setExpectedLastWorkingDay(e.target.value)} required />
        </label>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" disabled={submit.isPending}>{submit.isPending ? 'Submitting...' : 'Submit Resignation'}</Button>
      </form>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left">
            <tr>
              <th className="p-3">Last Working Day</th>
              <th className="p-3">Notice</th>
              <th className="p-3">Reason</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">No resignation records</td>
              </tr>
            ) : (
              (data ?? []).map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="p-3">{new Date(item.expectedLastWorkingDay).toLocaleDateString()}</td>
                  <td className="p-3">{item.noticePeriodDays} days</td>
                  <td className="p-3 max-w-xs truncate">{item.reason}</td>
                  <td className="p-3"><StatusBadge status={item.status} /></td>
                  <td className="p-3 text-right">
                    {['pending', 'draft', 'in_progress'].includes(item.status) ? (
                      <Button size="sm" variant="outline" disabled={withdraw.isPending} onClick={() => void withdraw.mutateAsync(item.id)}>
                        Withdraw
                      </Button>
                    ) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
