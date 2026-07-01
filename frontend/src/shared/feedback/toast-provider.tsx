import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useToastStore, type ToastItem } from '@/shared/feedback/toast.store';
import { cn } from '@/shared/utils/cn';

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const Icon = toast.variant === 'success' ? CheckCircle2 : toast.variant === 'error' ? AlertCircle : Info;

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto w-full max-w-sm rounded-lg border bg-card p-4 text-card-foreground shadow-lg',
        toast.variant === 'success' && 'border-emerald-200',
        toast.variant === 'error' && 'border-destructive/40',
        toast.variant === 'info' && 'border-primary/30',
      )}
    >
      <div className="flex items-start gap-3">
        <Icon
          className={cn(
            'mt-0.5 h-5 w-5 shrink-0',
            toast.variant === 'success' && 'text-emerald-600',
            toast.variant === 'error' && 'text-destructive',
            toast.variant === 'info' && 'text-primary',
          )}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{toast.title}</p>
          {toast.description ? (
            <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{toast.description}</p>
          ) : null}
        </div>
        <button
          type="button"
          aria-label="Dismiss notification"
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={() => onDismiss(toast.id)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function ToastProvider() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[200] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </div>
  );
}
