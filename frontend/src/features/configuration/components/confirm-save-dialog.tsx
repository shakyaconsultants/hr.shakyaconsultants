import { ConfirmDialog } from '@/shared/components/confirm-dialog';

interface ConfirmSaveDialogProps {
  open: boolean;
  changedCount: number;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmSaveDialog({
  open,
  changedCount,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmSaveDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      title="Save configuration changes"
      description={`You are about to save ${changedCount} setting${changedCount === 1 ? '' : 's'}. Changes take effect immediately for all users in this company.`}
      confirmLabel="Save changes"
      isLoading={isLoading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
