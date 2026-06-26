import { useLeaveRequests } from '@/features/leave-exit/hooks/use-leave-exit';
import { WidgetSkeleton } from '@/features/workspace/components/widget-primitives';

export function LeaveSummaryWidget() {
  const { data, isLoading, isError } = useLeaveRequests({ status: 'approved', page: 1, pageSize: 5 });

  if (isLoading) {
    return <WidgetSkeleton title="Employees On Leave" />;
  }

  if (isError) {
    return <p className="text-sm text-destructive">Unable to load leave summary.</p>;
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No employees on leave today.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {items.slice(0, 5).map((request) => (
        <li key={request.id} className="flex justify-between gap-2 border-b pb-2 last:border-0">
          <span>{request.employeeId}</span>
          <span className="text-muted-foreground">{request.leavePolicyId}</span>
        </li>
      ))}
    </ul>
  );
}
