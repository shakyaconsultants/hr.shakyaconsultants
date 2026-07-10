import type {
  IntegrationStatus,
  JobStatus,
  WebhookDeliveryStatus,
} from '@/features/integration/api/integration.api';
import { cn } from '@/shared/utils/cn';

type StatusVariant =
  | IntegrationStatus
  | JobStatus
  | WebhookDeliveryStatus
  | 'active'
  | 'revoked'
  | 'expired'
  | 'verified';

const STATUS_STYLES: Record<string, string> = {
  connected: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15',
  active: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15',
  delivered: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15',
  completed: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15',
  verified: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15',
  pending: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/15',
  running: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/15',
  retrying: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/15',
  disconnected: 'bg-muted text-muted-foreground ring-1 ring-inset ring-border',
  disabled: 'bg-muted text-muted-foreground ring-1 ring-inset ring-border',
  revoked: 'bg-muted text-muted-foreground ring-1 ring-inset ring-border',
  cancelled: 'bg-muted text-muted-foreground ring-1 ring-inset ring-border',
  error: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/15',
  failed: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/15',
  expired: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/15',
};

interface StatusBadgeProps {
  status: StatusVariant | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = String(status).toLowerCase();
  const style =
    STATUS_STYLES[normalized] ?? 'bg-muted text-muted-foreground ring-1 ring-inset ring-border';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        style,
        className,
      )}
    >
      {normalized.replace(/_/g, ' ')}
    </span>
  );
}
