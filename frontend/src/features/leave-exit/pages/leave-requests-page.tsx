import { LeaveExitNav, LeaveExitPageHeader, StatusBadge } from '@/features/leave-exit/components/leave-exit-nav';
import { useLeaveRequests } from '@/features/leave-exit/hooks/use-leave-exit';
import { useResolvedPortal } from '@/app/hooks/use-resolved-portal';
import { PORTAL } from '@/config/portals';
import { Loading } from '@/shared/components/loading';

export function LeaveRequestsPage() {
  const portal = useResolvedPortal();
  const { data, isLoading } = useLeaveRequests({ pageSize: 50 });

  const title = portal === PORTAL.MANAGER ? 'Team Leave Requests' : 'Leave Requests';
  const description =
    portal === PORTAL.MANAGER
      ? 'Review and action pending leave requests from your team.'
      : 'Review and manage company-wide leave requests.';

  if (isLoading) return <Loading message="Loading leave requests..." />;

  return (
    <div className="space-y-6">
      <LeaveExitPageHeader title={title} description={description} />
      <LeaveExitNav />

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left">
            <tr>
              <th className="p-3">Employee</th>
              <th className="p-3">Period</th>
              <th className="p-3">Days</th>
              <th className="p-3">Reason</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  No leave requests
                </td>
              </tr>
            ) : (
              (data?.items ?? []).map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="p-3 font-mono text-xs">{item.employeeId}</td>
                  <td className="p-3">
                    {new Date(item.startDate).toLocaleDateString()} – {new Date(item.endDate).toLocaleDateString()}
                  </td>
                  <td className="p-3">{item.totalDays}</td>
                  <td className="p-3 max-w-xs truncate">{item.reason}</td>
                  <td className="p-3">
                    <StatusBadge status={item.status} />
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
