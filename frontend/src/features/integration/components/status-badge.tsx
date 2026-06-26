import type { IntegrationStatus, JobStatus, WebhookDeliveryStatus } from '@/features/integration/api/integration.api';
import { cn } from '@/shared/utils/cn';

type StatusVariant = IntegrationStatus | JobStatus | WebhookDeliveryStatus | 'active' | 'revoked' | 'expired' | 'verified';

const STATUS_STYLES: Record<string, string> = {
  connected: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  verified: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  running: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  retrying: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  disconnected: 'bg-muted text-muted-foreground',
  disabled: 'bg-muted text-muted-foreground',
  revoked: 'bg-muted text-muted-foreground',
  cancelled: 'bg-muted text-muted-foreground',
  error: 'bg-destructive/10 text-destructive',
  failed: 'bg-destructive/10 text-destructive',
  expired: 'bg-destructive/10 text-destructive',
};

interface StatusBadgeProps {
  status: StatusVariant | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = String(status).toLowerCase();
  const style = STATUS_STYLES[normalized] ?? 'bg-muted text-muted-foreground';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize',
        style,
        className,
      )}
    >
      {normalized.replace(/_/g, ' ')}
    </span>
  );
}
