export { REPORTS_PERMISSIONS } from '@modules/reports/constants/reports-permissions.constants.js';

import { ATTENDANCE_REPORT_PERIOD, ATTENDANCE_REPORT_SCOPE } from '@modules/attendance/constants/attendance.constants.js';
import { PAYROLL_REPORT_TYPE } from '@modules/payroll/constants/payroll.constants.js';
import { SALES_REPORT_TYPE } from '@modules/sales/constants/sales.constants.js';
import { COMMUNICATION_REPORT_TYPE } from '@modules/communication/constants/communication.constants.js';

export const REPORTS_ROUTES = {
  BASE: '/reports',
} as const;

export const REPORTS_AUDIT_WHERE = 'reports' as const;

export const REPORT_DOMAIN = {
  HR: 'hr',
  FINANCE: 'finance',
  PROJECT: 'project',
  SALES: 'sales',
  ATTENDANCE: 'attendance',
  EXECUTIVE: 'executive',
  SYSTEM: 'system',
} as const;

export const HR_REPORT_TYPE = {
  EMPLOYEE_GROWTH: 'employee_growth',
  DEPARTMENT_STRENGTH: 'department_strength',
  HIRING_FUNNEL: 'hiring_funnel',
  INTERVIEW_STATS: 'interview_stats',
  OFFER_ACCEPTANCE: 'offer_acceptance',
  ATTRITION: 'attrition',
  NOTICE_PERIOD: 'notice_period',
  JOINING_TRENDS: 'joining_trends',
  LEAVE_ANALYTICS: 'leave_analytics',
  TRAINING_COMPLETION: 'training_completion',
  DOCUMENT_EXPIRY: 'document_expiry',
} as const;

export const ATTENDANCE_DELEGATED_REPORT_TYPE = {
  PERIOD: ATTENDANCE_REPORT_PERIOD,
  SCOPE: ATTENDANCE_REPORT_SCOPE,
  WEEKLY_TREND: 'weekly_trend',
  ENTERPRISE_DASHBOARD: 'enterprise_dashboard',
} as const;

export const FINANCE_DELEGATED_REPORT_TYPE = PAYROLL_REPORT_TYPE;

export const SALES_DELEGATED_REPORT_TYPE = SALES_REPORT_TYPE;

export const PROJECT_DELEGATED_REPORT_TYPE = {
  PROJECT_DASHBOARD: 'project_dashboard',
  MANAGER_DASHBOARD: 'manager_dashboard',
} as const;

export const RECRUITMENT_DELEGATED_REPORT_TYPE = {
  DASHBOARD: 'dashboard',
} as const;

export const COMMUNICATION_DELEGATED_REPORT_TYPE = COMMUNICATION_REPORT_TYPE;

export const REPORT_TYPE = {
  ...HR_REPORT_TYPE,
  ATTENDANCE_SUMMARY: 'attendance_summary',
  ...FINANCE_DELEGATED_REPORT_TYPE,
  ...SALES_DELEGATED_REPORT_TYPE,
  ...PROJECT_DELEGATED_REPORT_TYPE,
  RECRUITMENT_DASHBOARD: 'recruitment_dashboard',
  COMMUNICATION_REACH: COMMUNICATION_REPORT_TYPE.REACH,
} as const;

export const EXECUTIVE_ROLE = {
  CEO: 'ceo',
  HR_HEAD: 'hr_head',
  FINANCE_HEAD: 'finance_head',
  PROJECT_HEAD: 'project_head',
  SALES_HEAD: 'sales_head',
  OPERATIONS_HEAD: 'operations_head',
} as const;

export const WIDGET_TYPES = {
  STAT_CARD: 'stat_card',
  CHART: 'chart',
  TABLE: 'table',
  HEATMAP: 'heatmap',
  TREND: 'trend',
  PROGRESS: 'progress',
} as const;

export const REPORTS_SETTINGS_GROUP = 'reports' as const;

export const REPORTS_SETTING_KEYS = {
  DASHBOARD_LAYOUT: 'reports.dashboard_layout',
  WIDGET_CONFIG: 'reports.widget_config',
} as const;

export const CACHE_TTL = {
  REPORT_ENGINE: 300,
  DASHBOARD: 120,
  WIDGET: 60,
} as const;

export const DEFAULT_DASHBOARD_LAYOUT = {
  widgets: [] as Array<{ id: string; x: number; y: number; w: number; h: number }>,
} as const;
