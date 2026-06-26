export const APPROVAL_ROUTES = {
  BASE: '/approvals',
} as const;

export const APPROVAL_REQUEST_TYPE = {
  LEAVE: 'leave',
  RESIGNATION: 'resignation',
  EXIT_CLEARANCE: 'exit_clearance',
  ATTENDANCE_CORRECTION: 'attendance_correction',
  PAYROLL_RUN: 'payroll_run',
  SALARY_REVISION: 'salary_revision',
  GENERIC: 'generic',
} as const;

export const APPROVAL_ENTITY_TYPE = {
  LEAVE_REQUEST: 'leave_request',
  RESIGNATION: 'resignation',
  EXIT_PROCESS: 'exit_process',
  ATTENDANCE_CORRECTION: 'attendance_correction',
  PAYROLL_RUN: 'payroll_run',
  SALARY_REVISION: 'salary_revision',
} as const;

export const APPROVAL_AUDIT_WHERE = 'approval' as const;

export const APPROVAL_NOTIFICATION_JOB = {
  PENDING: 'approval.pending',
  APPROVED: 'approval.approved',
  REJECTED: 'approval.rejected',
  ESCALATED: 'approval.escalated',
} as const;

export const DEFAULT_LEAVE_WORKFLOW_STAGES = [
  { order: 1, name: 'Manager', slug: 'manager', approverType: 'manager', isRequired: true, slaHours: 48 },
  { order: 2, name: 'HR', slug: 'hr', approverType: 'role', approverRoleSlug: 'hr', isRequired: true, slaHours: 48 },
  { order: 3, name: 'Director', slug: 'director', approverType: 'role', approverRoleSlug: 'director', isRequired: true, slaHours: 72 },
] as const;

export const DEFAULT_RESIGNATION_WORKFLOW_STAGES = [
  { order: 1, name: 'Manager', slug: 'manager', approverType: 'manager', isRequired: true, slaHours: 48 },
  { order: 2, name: 'HR', slug: 'hr', approverType: 'role', approverRoleSlug: 'hr', isRequired: true, slaHours: 48 },
  { order: 3, name: 'Director', slug: 'director', approverType: 'role', approverRoleSlug: 'director', isRequired: true, slaHours: 72 },
] as const;

export const DEFAULT_EXIT_WORKFLOW_STAGES = [
  { order: 1, name: 'Manager', slug: 'manager', approverType: 'manager', isRequired: true, slaHours: 48 },
  { order: 2, name: 'HR', slug: 'hr', approverType: 'role', approverRoleSlug: 'hr', isRequired: true, slaHours: 48 },
  { order: 3, name: 'IT Clearance', slug: 'it_clearance', approverType: 'role', approverRoleSlug: 'hr', isRequired: true, slaHours: 72 },
  { order: 4, name: 'Finance Clearance', slug: 'finance_clearance', approverType: 'role', approverRoleSlug: 'finance', isRequired: true, slaHours: 72 },
  { order: 5, name: 'Director', slug: 'director', approverType: 'role', approverRoleSlug: 'director', isRequired: true, slaHours: 72 },
] as const;

export const SECURE_TOKEN_DEFAULT_EXPIRY_HOURS = 48;
