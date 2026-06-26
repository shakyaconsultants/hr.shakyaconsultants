import { z } from 'zod';
import {
  REPORT_DOMAIN,
  EXECUTIVE_ROLE,
  HR_REPORT_TYPE,
  FINANCE_DELEGATED_REPORT_TYPE,
  SALES_DELEGATED_REPORT_TYPE,
} from '@modules/reports/constants/reports.constants.js';

export const idParamSchema = z.object({ id: z.string().min(1) });

export const roleParamSchema = z.object({
  role: z.enum(Object.values(EXECUTIVE_ROLE) as [string, ...string[]]),
});

export const domainParamSchema = z.object({
  domain: z.enum(Object.values(REPORT_DOMAIN) as [string, ...string[]]),
});

export const dashboardQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  year: z.coerce.number().int().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

export const reportFiltersSchema = dashboardQuerySchema.extend({
  branchId: z.uuid().optional(),
  departmentId: z.uuid().optional(),
  projectId: z.uuid().optional(),
  employeeId: z.uuid().optional(),
  search: z.string().optional(),
  groupBy: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  period: z.string().optional(),
  scope: z.string().optional(),
  type: z.string().optional(),
  format: z.enum(['csv', 'pdf', 'html']).optional(),
});

export const reportQuerySchema = reportFiltersSchema.extend({
  domain: z.enum(Object.values(REPORT_DOMAIN) as [string, ...string[]]),
  type: z.string().min(1),
});

export const exportQuerySchema = reportQuerySchema.extend({
  format: z.enum(['csv', 'pdf', 'html']).default('csv'),
});

export const widgetDataQuerySchema = reportFiltersSchema;

export const updateLayoutSchema = z.object({
  widgets: z.array(z.object({
    id: z.string().min(1),
    x: z.number().int().min(0),
    y: z.number().int().min(0),
    w: z.number().int().min(1),
    h: z.number().int().min(1),
  })),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1),
  role: z.enum(Object.values(EXECUTIVE_ROLE) as [string, ...string[]]).optional(),
});

export const analyticsDomainTypes: Record<string, string[]> = {
  [REPORT_DOMAIN.HR]: Object.values(HR_REPORT_TYPE),
  [REPORT_DOMAIN.FINANCE]: Object.values(FINANCE_DELEGATED_REPORT_TYPE),
  [REPORT_DOMAIN.SALES]: Object.values(SALES_DELEGATED_REPORT_TYPE),
  [REPORT_DOMAIN.ATTENDANCE]: ['attendance_summary', 'weekly_trend', 'enterprise_dashboard'],
  [REPORT_DOMAIN.PROJECT]: ['project_dashboard', 'manager_dashboard'],
};
