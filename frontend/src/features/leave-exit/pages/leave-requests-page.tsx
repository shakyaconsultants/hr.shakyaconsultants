import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LeaveExitNav, LeaveExitPageHeader, StatusBadge } from '@/features/leave-exit/components/leave-exit-nav';
import { useLeaveRequests } from '@/features/leave-exit/hooks/use-leave-exit';
import { useBulkApprove } from '@/features/approval/hooks/use-approval';
import { ApprovalActionButtons } from '@/features/approval/components/approval-action-buttons';
import { formatEmployeeLabel, useEmployeeLabelMap } from '@/features/employee/hooks/use-employee-label-map';
import { useResolvedPortal } from '@/app/hooks/use-resolved-portal';
import { PORTAL } from '@/config/portals';
import { ROUTES } from '@/config/app.config';
import { useAuthStore } from '@/shared/stores/app.store';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';

const STATUS_FILTERS = ['all', 'pending', 'approved', 'rejected', 'withdrawn'] as const;

export function LeaveRequestsPage() {
  const portal = useResolvedPortal();
  const canExecute = useAuthStore((s) => s.hasPermission('approval.execute'));
  const employeeLabels = useEmployeeLabelMap();
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('all');
  const [selected, setSelected] = useState<string[]>([]);

  const listParams = {
    pageSize: 50,
    status: statusFilter === 'all' ? undefined : statusFilter,
  };
  const { data, isLoading, refetch } = useLeaveRequests(listParams);
  const bulkApprove = useBulkApprove();

  const title = portal === PORTAL.MANAGER ? 'Team Leave Requests' : 'Leave Requests';
  const description =
    portal === PORTAL.MANAGER
      ? 'Review and approve or reject pending leave requests from your team.'
      : 'Review and manage company-wide leave requests.';

  const toggleSelect = (approvalRequestId: string) => {
    setSelected((prev) =>
      prev.includes(approvalRequestId) ? prev.filter((id) => id !== approvalRequestId) : [...prev, approvalRequestId],
    );
  };

  if (isLoading) return <Loading message="Loading leave requests..." />;

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <LeaveExitPageHeader title={title} description={description} />
        {canExecute ? (
          <Button variant="outline" size="sm" asChild>
            <Link to={ROUTES.APPROVAL_INBOX}>Open Approval Inbox</Link>
          </Button>
        ) : null}
      </div>
      <LeaveExitNav />

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((status) => (
          <Button
            key={status}
            size="sm"
            variant={statusFilter === status ? 'default' : 'outline'}
            onClick={() => setStatusFilter(status)}
          >
            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      {selected.length > 0 && canExecute ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-3">
          <span className="text-sm">{selected.length} selected</span>
          <Button
            size="sm"
            disabled={bulkApprove.isPending}
            onClick={() => {
              void bulkApprove.mutateAsync({ requestIds: selected }).then(() => {
                setSelected([]);
                void refetch();
              });
            }}
          >
            Bulk Approve
          </Button>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left">
            <tr>
              {canExecute ? <th className="p-3 w-10" /> : null}
              <th className="p-3">Employee</th>
              <th className="p-3">Period</th>
              <th className="p-3">Days</th>
              <th className="p-3">Reason</th>
              <th className="p-3">Status</th>
              {canExecute ? <th className="p-3 text-right">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={canExecute ? 7 : 5} className="p-8 text-center text-muted-foreground">
                  No leave requests
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const canAction = item.status === 'pending' && Boolean(item.approvalRequestId);

                return (
                  <tr key={item.id} className="border-b last:border-0">
                    {canExecute ? (
                      <td className="p-3">
                        {canAction && item.approvalRequestId ? (
                          <input
                            type="checkbox"
                            checked={selected.includes(item.approvalRequestId)}
                            onChange={() => toggleSelect(item.approvalRequestId!)}
                          />
                        ) : null}
                      </td>
                    ) : null}
                    <td className="p-3">{formatEmployeeLabel(employeeLabels, item.employeeId)}</td>
                    <td className="p-3">
                      {new Date(item.startDate).toLocaleDateString()} – {new Date(item.endDate).toLocaleDateString()}
                    </td>
                    <td className="p-3">{item.totalDays}</td>
                    <td className="p-3 max-w-xs truncate">{item.reason}</td>
                    <td className="p-3">
                      <StatusBadge status={item.status} />
                    </td>
                    {canExecute ? (
                      <td className="p-3">
                        {canAction && item.approvalRequestId ? (
                          <ApprovalActionButtons approvalRequestId={item.approvalRequestId} />
                        ) : null}
                      </td>
                    ) : null}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
