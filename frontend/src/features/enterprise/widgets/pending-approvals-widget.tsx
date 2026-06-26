import { Link } from 'react-router-dom';
import { useApprovalInbox } from '@/features/approval/hooks/use-approval';
import { ROUTES } from '@/config/app.config';
import { WidgetSkeleton } from '@/features/workspace/components/widget-primitives';

export function PendingApprovalsWidget() {
  const { data, isLoading, isError } = useApprovalInbox({ page: 1, pageSize: 5, status: 'pending' });

  if (isLoading) {
    return <WidgetSkeleton title="Pending Approvals" />;
  }

  if (isError) {
    return <p className="text-sm text-destructive">Unable to load approvals.</p>;
  }

  const items = data?.items ?? [];
  const total = data?.pagination?.total ?? items.length;

  return (
    <div className="space-y-3">
      <p className="text-3xl font-bold">{total}</p>
      <p className="text-sm text-muted-foreground">Requests awaiting action</p>
      {items.slice(0, 3).map((item) => (
        <div key={item.id} className="text-sm">
          <span className="font-medium">{item.requestType}</span>
          <span className="text-muted-foreground"> — {item.status}</span>
        </div>
      ))}
      <Link to={ROUTES.APPROVAL_INBOX} className="text-sm font-medium text-primary hover:underline">
        Open approval inbox
      </Link>
    </div>
  );
}
