export { ATTENDANCE_PERMISSIONS } from '@modules/attendance/constants/attendance-permissions.constants.js';

export const ATTENDANCE_ROUTES = {
  BASE: '/attendance',
} as const;

export const ATTENDANCE_AUDIT_WHERE = 'attendance' as const;

export const ATTENDANCE_NOTIFICATION_JOB = {
  PUNCH_RECORDED: 'attendance.punch_recorded',
  CORRECTION_SUBMITTED: 'attendance.correction_submitted',
  CORRECTION_APPROVED: 'attendance.correction_approved',
  CORRECTION_REJECTED: 'attendance.correction_rejected',
  MONTHLY_PROCESSED: 'attendance.monthly_processed',
} as const;

export const ATTENDANCE_REPORT_PERIOD = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
} as const;

export const ATTENDANCE_REPORT_SCOPE = {
  EMPLOYEE: 'employee',
  DEPARTMENT: 'department',
  BRANCH: 'branch',
  COMPANY: 'company',
} as const;

export const ATTENDANCE_POLICY_KEYS = {
  GRACE_MINUTES: 'attendance.grace_minutes',
  LATE_THRESHOLD_MINUTES: 'attendance.late_threshold_minutes',
  EARLY_EXIT_THRESHOLD_MINUTES: 'attendance.early_exit_threshold_minutes',
  OVERTIME_THRESHOLD_MINUTES: 'attendance.overtime_threshold_minutes',
  HALF_DAY_THRESHOLD_MINUTES: 'attendance.half_day_threshold_minutes',
  WEEKLY_OFF_DAYS: 'attendance.weekly_off_days',
  CORRECTION_WORKFLOW_SLUG: 'attendance.correction_workflow_slug',
} as const;

export const DEFAULT_ATTENDANCE_POLICIES = {
  graceMinutes: 15,
  lateThresholdMinutes: 15,
  earlyExitThresholdMinutes: 15,
  overtimeThresholdMinutes: 30,
  halfDayThresholdMinutes: 240,
  weeklyOffDays: [0, 6],
  correctionWorkflowSlug: 'attendance-correction-default',
} as const;
