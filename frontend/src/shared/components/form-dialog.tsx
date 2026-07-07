import { useId, type ReactNode } from 'react';
import { Dialog } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';

export interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  submitLabel?: string;
  pendingLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  submitDisabled?: boolean;
  onSubmit: () => void | Promise<void>;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  submitLabel = 'Save',
  pendingLabel = 'Saving...',
  cancelLabel = 'Cancel',
  isSubmitting = false,
  submitDisabled = false,
  onSubmit,
  size = 'lg',
}: FormDialogProps) {
  const formId = useId();

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSubmitting) {
          return;
        }
        onOpenChange(nextOpen);
      }}
      title={title}
      description={description}
      size={size}
      footer={
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {cancelLabel}
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={isSubmitting || submitDisabled}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? pendingLabel : submitLabel}
          </Button>
        </div>
      }
    >
      <form
        id={formId}
        onSubmit={(event) => {
          event.preventDefault();
          if (isSubmitting || submitDisabled) {
            return;
          }
          void onSubmit();
        }}
      >
        {children}
      </form>
    </Dialog>
  );
}
