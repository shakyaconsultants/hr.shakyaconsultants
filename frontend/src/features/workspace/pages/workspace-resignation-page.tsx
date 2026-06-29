import { FormEvent, useState } from 'react';
import { WorkspaceLeaveNav } from '@/features/workspace/components/workspace-leave-nav';
import { WorkspacePageHeader } from '@/features/workspace/components/workspace-nav';
import { StatusBadge } from '@/features/leave-exit/components/leave-exit-nav';
import { useResignations, useSubmitResignation, useWithdrawResignation } from '@/features/leave-exit/hooks/use-leave-exit';
import { runActionMutation, runFormMutation } from '@/shared/feedback/run-form-mutation';
import { DatePicker } from '@/shared/components/date-picker';
import { DurationInput } from '@/shared/components/duration-input';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';
import { toDateInputValue } from '@/shared/utils/datetime';
import { useAuthStore } from '@/shared/stores/app.store';

export function WorkspaceResignationPage() {
  const employeeId = useAuthStore((s) => s.user?.employeeId ?? s.employee?.id ?? '');
  const { data, isLoading } = useResignations(employeeId || undefined);
  const submit = useSubmitResignation();
  const withdraw = useWithdrawResignation();

  const [reason, setReason] = useState('');
  const [noticePeriodDays, setNoticePeriodDays] = useState(30);
  const [expectedLastWorkingDay, setExpectedLastWorkingDay] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!employeeId) {
      setError('Your employee profile is not linked to this account.');
      return;
    }
    if (submit.isPending) {
      return;
    }

    await runFormMutation({
      setError,
      successMessage: 'Resignation submitted successfully.',
      mutation: () => submit.mutateAsync({ employeeId, reason, noticePeriodDays, expectedLastWorkingDay }),
    });
  };

  if (isLoading) return <Loading message="Loading resignation records..." />;

  return (
    <div className="space-y-6">
      <WorkspacePageHeader title="Resignation" description="Submit resignation and track approval workflow." />
      <WorkspaceLeaveNav />

      {!employeeId ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Your account is not linked to an employee record. Contact HR to submit resignation.
        </p>
      ) : (
        <form onSubmit={(e) => void onSubmit(e)} className="max-w-xl space-y-4 rounded-lg border p-6">
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Reason *</span>
            <textarea className="w-full rounded-md border p-2" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} required />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Notice Period (days) *</span>
            <DurationInput value={noticePeriodDays} onChange={(value) => setNoticePeriodDays(value ?? 0)} min={0} max={365} required />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Expected Last Working Day *</span>
            <DatePicker value={expectedLastWorkingDay} onChange={setExpectedLastWorkingDay} min={toDateInputValue(new Date())} required />
          </label>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={submit.isPending}>
            {submit.isPending ? 'Submitting...' : 'Submit Resignation'}
          </Button>
        </form>
      )}

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
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  No resignation records
                </td>
              </tr>
            ) : (
              (data ?? []).map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="p-3">{new Date(item.expectedLastWorkingDay).toLocaleDateString()}</td>
                  <td className="p-3">{item.noticePeriodDays} days</td>
                  <td className="p-3 max-w-xs truncate">{item.reason}</td>
                  <td className="p-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="p-3 text-right">
                    {['pending', 'draft', 'in_progress'].includes(item.status) ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={withdraw.isPending}
                        onClick={() =>
                          void runActionMutation({
                            successMessage: 'Resignation withdrawn successfully.',
                            mutation: () => withdraw.mutateAsync(item.id),
                          })
                        }
                      >
                        Withdraw
                      </Button>
                    ) : (
                      '—'
                    )}
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
