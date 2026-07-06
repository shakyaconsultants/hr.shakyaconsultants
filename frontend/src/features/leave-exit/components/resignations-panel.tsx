import { useResignations } from '@/features/leave-exit/hooks/use-leave-exit';
import { ApprovalActionButtons } from '@/features/approval/components/approval-action-buttons';
import {
  formatEmployeeLabel,
  useEmployeeLabelMap,
} from '@/features/employee/hooks/use-employee-label-map';
import { StatusBadge } from '@/features/leave-exit/components/leave-exit-nav';
import { useAuthStore } from '@/shared/stores/app.store';
import { Loading } from '@/shared/components/loading';

export function ResignationsPanel() {
  const canExecute = useAuthStore((s) => s.hasPermission('approval.execute'));
  const employeeLabels = useEmployeeLabelMap();
  const { data, isLoading } = useResignations();

  if (isLoading) return <Loading message="Loading resignations..." />;

  const items = data ?? [];

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left">
          <tr>
            <th className="p-3">Employee</th>
            <th className="p-3">Last Working Day</th>
            <th className="p-3">Notice (days)</th>
            <th className="p-3">Reason</th>
            <th className="p-3">Status</th>
            {canExecute ? <th className="p-3 text-right">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={canExecute ? 6 : 5} className="p-8 text-center text-muted-foreground">
                No resignation requests
              </td>
            </tr>
          ) : (
            items.map((item) => {
              const canAction =
                (item.status === 'pending' || item.status === 'submitted') &&
                Boolean(item.approvalRequestId);

              return (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="p-3">{formatEmployeeLabel(employeeLabels, item.employeeId)}</td>
                  <td className="p-3">
                    {new Date(item.expectedLastWorkingDay).toLocaleDateString()}
                  </td>
                  <td className="p-3">{item.noticePeriodDays}</td>
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
  );
}
