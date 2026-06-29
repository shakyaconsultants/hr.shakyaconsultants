import { cn } from '@/shared/utils/cn';

const ENTITY_STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  inactive: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  archived: 'bg-muted text-muted-foreground',
  draft: 'bg-muted text-muted-foreground',
};

interface EntityStatusBadgeProps {
  status?: string | null;
  className?: string;
}

export function EntityStatusBadge({ status, className }: EntityStatusBadgeProps) {
  const normalized = (status ?? 'unknown').toLowerCase();
  const style = ENTITY_STATUS_STYLES[normalized] ?? 'bg-muted text-muted-foreground';

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
