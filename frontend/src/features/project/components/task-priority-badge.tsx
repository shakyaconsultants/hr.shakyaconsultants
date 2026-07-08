import { getTaskPriorityMeta } from '@/features/project/constants/task-priority';
import { cn } from '@/shared/utils/cn';

interface TaskPriorityBadgeProps {
  priority: string;
  className?: string;
}

export function TaskPriorityBadge({ priority, className }: TaskPriorityBadgeProps) {
  const meta = getTaskPriorityMeta(priority);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
        meta.badgeClass,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dotClass)} />
      {meta.label}
    </span>
  );
}
