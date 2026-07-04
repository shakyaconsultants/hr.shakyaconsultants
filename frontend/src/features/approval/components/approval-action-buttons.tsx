import { Button } from '@/shared/components/ui/button';
import { useApproveRequest, useRejectRequest } from '@/features/approval/hooks/use-approval';
import { useAuthStore } from '@/shared/stores/app.store';

interface ApprovalActionButtonsProps {
  approvalRequestId: string;
  disabled?: boolean;
  size?: 'sm' | 'default';
}

export function ApprovalActionButtons({ approvalRequestId, disabled, size = 'sm' }: ApprovalActionButtonsProps) {
  const canExecute = useAuthStore((s) => s.hasPermission('approval.execute'));
  const approve = useApproveRequest();
  const reject = useRejectRequest();

  if (!canExecute) {
    return null;
  }

  const busy = approve.isPending || reject.isPending;

  return (
    <div className="flex justify-end gap-2">
      <Button
        size={size}
        variant="outline"
        disabled={disabled || busy}
        onClick={() => void reject.mutateAsync({ id: approvalRequestId })}
      >
        Reject
      </Button>
      <Button
        size={size}
        disabled={disabled || busy}
        onClick={() => void approve.mutateAsync({ id: approvalRequestId })}
      >
        Approve
      </Button>
    </div>
  );
}
