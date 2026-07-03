export const ENTITY_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  ARCHIVED: 'archived',
  DELETED: 'deleted',
} as const;

export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  HALF_DAY: 'half_day',
  ON_LEAVE: 'on_leave',
  HOLIDAY: 'holiday',
  WEEKEND: 'weekend',
} as const;

export const LEAVE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
} as const;

export const PAYROLL_STATUS = {
  DRAFT: 'draft',
  PROCESSING: 'processing',
  PENDING_APPROVAL: 'pending_approval',
  LOCKED: 'locked',
  APPROVED: 'approved',
  COMPLETED: 'completed',
  FINALIZED: 'finalized',
  CANCELLED: 'cancelled',
} as const;

export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  DONE: 'done',
  CANCELLED: 'cancelled',
} as const;

export const INTERVIEW_STATUS = {
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
} as const;

export const PROJECT_STATUS = {
  DRAFT: 'draft',
  PLANNING: 'planning',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const PROJECT_KIND = {
  INTERNAL: 'internal',
  EXTERNAL: 'external',
} as const;

export const SALES_STATUS = {
  LEAD: 'lead',
  QUALIFIED: 'qualified',
  PROPOSAL: 'proposal',
  WON: 'won',
  LOST: 'lost',
} as const;
