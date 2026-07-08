export interface TaskPriorityMeta {
  value: string;
  label: string;
  badgeClass: string;
  dotClass: string;
}

const PRIORITY_META: Record<string, TaskPriorityMeta> = {
  p0: {
    value: 'p0',
    label: 'P0 — Critical',
    badgeClass: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
    dotClass: 'bg-red-500',
  },
  p1: {
    value: 'p1',
    label: 'P1 — High',
    badgeClass: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
    dotClass: 'bg-orange-500',
  },
  p2: {
    value: 'p2',
    label: 'P2 — Medium',
    badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
    dotClass: 'bg-amber-500',
  },
  p3: {
    value: 'p3',
    label: 'P3 — Low',
    badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    dotClass: 'bg-blue-500',
  },
  p4: {
    value: 'p4',
    label: 'P4 — Backlog',
    badgeClass: 'bg-muted text-muted-foreground border-border',
    dotClass: 'bg-muted-foreground',
  },
  urgent: {
    value: 'urgent',
    label: 'Urgent',
    badgeClass: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
    dotClass: 'bg-red-500',
  },
  high: {
    value: 'high',
    label: 'High',
    badgeClass: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
    dotClass: 'bg-orange-500',
  },
  medium: {
    value: 'medium',
    label: 'Medium',
    badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
    dotClass: 'bg-amber-500',
  },
  low: {
    value: 'low',
    label: 'Low',
    badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    dotClass: 'bg-blue-500',
  },
};

export const TASK_PRIORITY_SELECT_OPTIONS = [
  PRIORITY_META.p0,
  PRIORITY_META.p1,
  PRIORITY_META.p2,
  PRIORITY_META.p3,
  PRIORITY_META.p4,
] as const;

export const DEFAULT_TASK_PRIORITY = 'p2';

export function getTaskPriorityMeta(priority: string): TaskPriorityMeta {
  return (
    PRIORITY_META[priority] ?? {
      value: priority,
      label: priority.toUpperCase(),
      badgeClass: 'bg-muted text-muted-foreground border-border',
      dotClass: 'bg-muted-foreground',
    }
  );
}
