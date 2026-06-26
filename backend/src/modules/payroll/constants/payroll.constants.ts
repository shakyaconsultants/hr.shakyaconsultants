export { PAYROLL_PERMISSIONS, PAYSLIP_PERMISSIONS } from '@modules/payroll/constants/payroll-permissions.constants.js';

export const PAYROLL_ROUTES = {
  BASE: '/payroll',
} as const;

export const PAYROLL_AUDIT_WHERE = 'payroll' as const;

export const PAYROLL_NOTIFICATION_JOB = {
  RUN_CREATED: 'payroll.run_created',
  RUN_PROCESSED: 'payroll.run_processed',
  RUN_SUBMITTED: 'payroll.run_submitted',
  RUN_APPROVED: 'payroll.run_approved',
  RUN_REJECTED: 'payroll.run_rejected',
  RUN_LOCKED: 'payroll.run_locked',
  PAYSLIP_GENERATED: 'payroll.payslip_generated',
  REVISION_SUBMITTED: 'payroll.revision_submitted',
  REVISION_APPROVED: 'payroll.revision_approved',
  REVISION_REJECTED: 'payroll.revision_rejected',
} as const;

export const PAYROLL_REPORT_TYPE = {
  MONTHLY: 'monthly',
  DEPARTMENT: 'department',
  BRANCH: 'branch',
  SALARY_REGISTER: 'salary_register',
  SUMMARY: 'summary',
  ANALYTICS: 'analytics',
} as const;

export const PAYROLL_POLICY_KEYS = {
  CALENDAR_START_DAY: 'payroll.calendar_start_day',
  LOCK_AFTER_DAYS: 'payroll.lock_after_days',
  APPROVAL_WORKFLOW_SLUG: 'payroll.approval_workflow_slug',
  REVISION_WORKFLOW_SLUG: 'payroll.revision_workflow_slug',
  STATUTORY_PLUGINS: 'payroll.statutory_plugins',
  OVERTIME_RATE_MULTIPLIER: 'payroll.overtime_rate_multiplier',
  LWP_DEDUCTION_BASIS: 'payroll.lwp_deduction_basis',
  COMPANY_DISPLAY_NAME: 'payroll.company_display_name',
} as const;

export const DEFAULT_PAYROLL_POLICIES = {
  calendarStartDay: 1,
  lockAfterDays: 7,
  approvalWorkflowSlug: 'payroll-run-default',
  revisionWorkflowSlug: 'salary-revision-default',
  statutoryPlugins: [] as Array<{ pluginId: string; enabled: boolean; config: Record<string, unknown> }>,
  overtimeRateMultiplier: 1.5,
  lwpDeductionBasis: 'daily',
  companyDisplayName: '',
} as const;

export const PAYROLL_COMPONENT_KIND = {
  ALLOWANCE: 'allowance',
  DEDUCTION: 'deduction',
} as const;
