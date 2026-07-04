import { WorkspaceLeaveNav } from '@/features/workspace/components/workspace-leave-nav';
import { WorkspacePageHeader } from '@/features/workspace/components/workspace-nav';
import { StatusBadge } from '@/features/leave-exit/components/leave-exit-nav';
import { useLeaveRequests, useWithdrawLeave } from '@/features/leave-exit/hooks/use-leave-exit';
import { parseMutationError } from '@/shared/feedback/mutation-error.util';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';
import { useAuthStore, selectLinkedEmployeeId } from '@/shared/stores/app.store';

export function WorkspaceLeaveRequestsPage() {
  const employeeId = useAuthStore(selectLinkedEmployeeId);
  const { data, isLoading, isError, error, refetch } = useLeaveRequests({ pageSize: 50, scope: 'mine' });
  const withdraw = useWithdrawLeave();

  if (isLoading) return <Loading message="Loading your leave requests..." />;

  if (!employeeId) {
    return (
      <div className="space-y-6">
        <WorkspacePageHeader title="My Leave Requests" description="Track status and withdraw pending requests." />
        <WorkspaceLeaveNav />
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Your account is not linked to an employee record. Contact HR to view leave requests.
        </p>
      </div>
    );
  }

  if (isError) {
    const message = parseMutationError(error).message;
    return (
      <div className="space-y-6">
        <WorkspacePageHeader title="My Leave Requests" description="Track status and withdraw pending requests." />
        <WorkspaceLeaveNav />
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <p>{message}</p>
          <Button className="mt-3" size="sm" variant="outline" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WorkspacePageHeader title="My Leave Requests" description="Track status and withdraw pending requests." />
      <WorkspaceLeaveNav />

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left">
            <tr>
              <th className="p-3">Period</th>
              <th className="p-3">Days</th>
              <th className="p-3">Reason</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  No leave requests yet
                </td>
              </tr>
            ) : (
              (data?.items ?? []).map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="p-3">
                    {new Date(item.startDate).toLocaleDateString()} – {new Date(item.endDate).toLocaleDateString()}
                  </td>
                  <td className="p-3">{item.totalDays}</td>
                  <td className="p-3 max-w-xs truncate">{item.reason}</td>
                  <td className="p-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="p-3 text-right">
                    {item.status === 'pending' || item.status === 'draft' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={withdraw.isPending}
                        onClick={() => void withdraw.mutateAsync(item.id)}
                      >
                        Withdraw
                      </Button>
                    ) : null}
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
