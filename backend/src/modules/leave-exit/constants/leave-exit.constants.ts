export const LEAVE_EXIT_ROUTES = {
  BASE: '/leave-exit',
} as const;

export const LEAVE_EXIT_PERMISSIONS = {
  LEAVE_READ: 'leave.read',
  LEAVE_CREATE: 'leave.create',
  LEAVE_UPDATE: 'leave.update',
  LEAVE_DELETE: 'leave.delete',
  LEAVE_APPROVE: 'leave.approve',
  POLICY_READ: 'leave.policy.read',
  POLICY_MANAGE: 'leave.policy.manage',
  BALANCE_READ: 'leave.balance.read',
  BALANCE_MANAGE: 'leave.balance.manage',
  RESIGNATION_READ: 'resignation.read',
  RESIGNATION_CREATE: 'resignation.create',
  RESIGNATION_UPDATE: 'resignation.update',
  RESIGNATION_APPROVE: 'resignation.approve',
  EXIT_READ: 'exit.read',
  EXIT_MANAGE: 'exit.manage',
  CALENDAR_READ: 'leave.calendar.read',
} as const;

export const LEAVE_EXIT_AUDIT_WHERE = 'leave_exit' as const;

export const LEAVE_EXIT_NOTIFICATION_JOB = {
  LEAVE_APPLIED: 'leave.applied',
  LEAVE_APPROVED: 'leave.approved',
  LEAVE_REJECTED: 'leave.rejected',
  RESIGNATION_SUBMITTED: 'resignation.submitted',
  EXIT_STARTED: 'exit.started',
  EXIT_COMPLETED: 'exit.completed',
} as const;

export const LEAVE_BALANCE_LEDGER_TYPE = {
  OPENING: 'opening',
  EARNED: 'earned',
  USED: 'used',
  PENDING: 'pending',
  RELEASED: 'released',
  CARRY_FORWARD: 'carry_forward',
  EXPIRED: 'expired',
  ADJUSTMENT: 'adjustment',
} as const;
