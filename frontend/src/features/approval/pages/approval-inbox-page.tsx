import { useMemo, useState } from 'react';
import { CheckSquare, Inbox } from 'lucide-react';
import { ApprovalNav, ApprovalPageHeader } from '@/features/approval/components/approval-nav';
import { useApprovalInbox, useApproveRequest, useBulkApprove, useRejectRequest } from '@/features/approval/hooks/use-approval';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';
import { StatusBadge } from '@/features/leave-exit/components/leave-exit-nav';

export function ApprovalInboxPage() {
  const { data, isLoading } = useApprovalInbox({ pageSize: 50 });
  const approve = useApproveRequest();
  const reject = useRejectRequest();
  const bulkApprove = useBulkApprove();
  const [selected, setSelected] = useState<string[]>([]);
  const [comment, setComment] = useState('');

  const items = useMemo(() => data?.items ?? [], [data]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  if (isLoading) return <Loading message="Loading approval inbox..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Inbox className="h-5 w-5 text-primary" />
        <ApprovalPageHeader title="Approval Inbox" description="Review and action pending approval requests." />
      </div>
      <ApprovalNav />

      {selected.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-3">
          <span className="text-sm">{selected.length} selected</span>
          <Button
            size="sm"
            disabled={bulkApprove.isPending}
            onClick={() => {
              void bulkApprove.mutateAsync({ requestIds: selected, comments: comment || undefined }).then(() => setSelected([]));
            }}
          >
            <CheckSquare className="mr-1 h-4 w-4" />
            Bulk Approve
          </Button>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left">
            <tr>
              <th className="p-3 w-10" />
              <th className="p-3">Request</th>
              <th className="p-3">Type</th>
              <th className="p-3">Stage</th>
              <th className="p-3">Status</th>
              <th className="p-3">Submitted</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  No pending approvals
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="p-3">
                    <input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleSelect(item.id)} />
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{item.title}</div>
                    {item.description ? <div className="text-xs text-muted-foreground">{item.description}</div> : null}
                  </td>
                  <td className="p-3 capitalize">{item.requestType.replace(/_/g, ' ')}</td>
                  <td className="p-3 capitalize">{item.currentStageSlug?.replace(/_/g, ' ') ?? '—'}</td>
                  <td className="p-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="p-3">{item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : '—'}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={reject.isPending}
                        onClick={() => void reject.mutateAsync({ id: item.id, comments: comment || undefined })}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        disabled={approve.isPending}
                        onClick={() => void approve.mutateAsync({ id: item.id, comments: comment || undefined })}
                      >
                        Approve
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="max-w-md space-y-2">
        <label className="text-sm font-medium" htmlFor="approval-comment">
          Comment (optional, applies to next action)
        </label>
        <textarea
          id="approval-comment"
          className="w-full rounded-md border bg-background p-2 text-sm"
          rows={2}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>
    </div>
  );
}
