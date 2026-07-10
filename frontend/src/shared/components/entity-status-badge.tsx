import { cn } from '@/shared/utils/cn';

const ENTITY_STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15',
  inactive: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-300/50',
  archived: 'bg-muted text-muted-foreground ring-1 ring-inset ring-border',
  draft: 'bg-muted text-muted-foreground ring-1 ring-inset ring-border',
  away: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/15',
  on_leave: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/15',
};

interface EntityStatusBadgeProps {
  status?: string | null;
  className?: string;
}

export function EntityStatusBadge({ status, className }: EntityStatusBadgeProps) {
  const normalized = (status ?? 'unknown').toLowerCase();
  const style =
    ENTITY_STATUS_STYLES[normalized] ??
    'bg-muted text-muted-foreground ring-1 ring-inset ring-border';

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
