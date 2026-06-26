import { useMemo } from 'react';
import { History } from 'lucide-react';
import { ApprovalNav, ApprovalPageHeader } from '@/features/approval/components/approval-nav';
import { useApprovalRequests } from '@/features/approval/hooks/use-approval';
import { StatusBadge } from '@/features/leave-exit/components/leave-exit-nav';
import { Loading } from '@/shared/components/loading';

export function ApprovalHistoryPage() {
  const { data, isLoading } = useApprovalRequests({ pageSize: 100 });
  const items = useMemo(() => data?.items ?? [], [data]);

  if (isLoading) return <Loading message="Loading approval history..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <History className="h-5 w-5 text-primary" />
        <ApprovalPageHeader title="Approval History" description="All approval requests across the organization." />
      </div>
      <ApprovalNav />

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left">
            <tr>
              <th className="p-3">Request</th>
              <th className="p-3">Type</th>
              <th className="p-3">Status</th>
              <th className="p-3">Submitted</th>
              <th className="p-3">Completed</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  No approval records
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{item.title}</td>
                  <td className="p-3 capitalize">{item.requestType.replace(/_/g, ' ')}</td>
                  <td className="p-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="p-3">{item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : '—'}</td>
                  <td className="p-3">{item.completedAt ? new Date(item.completedAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
