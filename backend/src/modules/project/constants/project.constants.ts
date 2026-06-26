export const PROJECT_ROUTES = {
  BASE: '/projects',
  DASHBOARD: '/dashboard',
} as const;

export const PROJECT_AUDIT_WHERE = 'projects' as const;

export const PROJECT_NOTIFICATION_JOB = {
  TASK_ASSIGNED: 'project.task_assigned',
  TASK_DUE: 'project.task_due',
  TASK_COMPLETED: 'project.task_completed',
  TASK_REJECTED: 'project.task_rejected',
  SPRINT_STARTED: 'project.sprint_started',
  MILESTONE_COMPLETED: 'project.milestone_completed',
  PROJECT_ARCHIVED: 'project.archived',
} as const;

export const DEFAULT_TASK_WORKFLOW_STAGES = [
  { slug: 'backlog', name: 'Backlog', sortOrder: 1, isTerminal: false, isDefault: true },
  { slug: 'todo', name: 'Todo', sortOrder: 2, isTerminal: false, isDefault: false },
  { slug: 'assigned', name: 'Assigned', sortOrder: 3, isTerminal: false, isDefault: false },
  { slug: 'in_progress', name: 'In Progress', sortOrder: 4, isTerminal: false, isDefault: false },
  { slug: 'completed', name: 'Completed', sortOrder: 5, isTerminal: false, isDefault: false },
  { slug: 'verified', name: 'Verified', sortOrder: 6, isTerminal: false, isDefault: false },
  { slug: 'closed', name: 'Closed', sortOrder: 7, isTerminal: true, isDefault: false },
  { slug: 'rejected', name: 'Rejected', sortOrder: 8, isTerminal: true, isDefault: false },
  { slug: 'blocked', name: 'Blocked', sortOrder: 9, isTerminal: false, isDefault: false },
  { slug: 'cancelled', name: 'Cancelled', sortOrder: 10, isTerminal: true, isDefault: false },
] as const;
