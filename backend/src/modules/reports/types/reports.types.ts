import {
  REPORT_DOMAIN,
  EXECUTIVE_ROLE,
  WIDGET_TYPES,
} from '@modules/reports/constants/reports.constants.js';

export type ReportDomain = (typeof REPORT_DOMAIN)[keyof typeof REPORT_DOMAIN];
export type ExecutiveRole = (typeof EXECUTIVE_ROLE)[keyof typeof EXECUTIVE_ROLE];
export type WidgetType = (typeof WIDGET_TYPES)[keyof typeof WIDGET_TYPES];

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  branchId?: string;
  departmentId?: string;
  projectId?: string;
  employeeId?: string;
  search?: string;
  groupBy?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  year?: number;
  month?: number;
  period?: string;
  scope?: string;
  type?: string;
  format?: string;
}

export interface ReportRequest {
  domain: ReportDomain;
  type: string;
  filters?: ReportFilters;
}

export interface WidgetDefinition {
  id: string;
  title: string;
  description?: string;
  type: WidgetType;
  domain: ReportDomain;
  reportType?: string;
  defaultSize: { w: number; h: number };
  roles: ExecutiveRole[];
}

export interface DashboardLayout {
  widgets: Array<{ id: string; x: number; y: number; w: number; h: number }>;
}

export interface ReportMetadata {
  id: string;
  domain: ReportDomain;
  type: string;
  title: string;
  description: string;
  exportable: boolean;
}
