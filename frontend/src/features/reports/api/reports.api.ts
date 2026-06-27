import apiClient from '@/shared/api/axios.client';
import type { ApiSuccessResponse, PaginatedResult } from '@/shared/types/api.types';

const REPORTS_PREFIX = '/api/v1/reports';

export type ReportDomain = 'hr' | 'finance' | 'project' | 'sales' | 'attendance' | 'operations' | 'communication';
export type DashboardRole = 'ceo' | 'hr' | 'finance' | 'project' | 'sales' | 'operations';
export type WidgetType = 'stat' | 'chart' | 'table' | 'trend' | 'progress' | 'heatmap';
export type ReportRunStatus = 'pending' | 'running' | 'completed' | 'failed';
export type ExportFormat = 'csv' | 'pdf';

export interface ReportFilterParams {
  startDate?: string;
  endDate?: string;
  branchId?: string;
  departmentId?: string;
  projectId?: string;
  employeeId?: string;
  search?: string;
}

export interface ReportParameterDefinition {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'select' | 'boolean';
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  defaultValue?: string | number | boolean;
}

export interface ReportDefinition {
  code: string;
  name: string;
  description?: string;
  domain: ReportDomain | string;
  category?: string;
  parameters: ReportParameterDefinition[];
  moduleRoute?: string;
  supportsExport?: boolean;
}

export interface ReportWidget {
  id: string;
  type: WidgetType;
  title: string;
  colSpan?: 1 | 2 | 3 | 4;
  data: Record<string, unknown>;
}

export interface DashboardResponse {
  role: string;
  widgets: ReportWidget[];
  generatedAt: string;
}

export interface DashboardLayoutItem {
  widgetId: string;
  colSpan: 1 | 2 | 3 | 4;
  order: number;
  visible: boolean;
}

export interface DashboardConfig {
  role: string;
  layout: DashboardLayoutItem[];
}

export interface RunReportPayload {
  domain: string;
  type: string;
  parameters?: Record<string, unknown>;
  format?: 'json' | ExportFormat;
  async?: boolean;
}

export interface ReportRunResult {
  id: string;
  domain: string;
  type: string;
  status: ReportRunStatus;
  parameters?: Record<string, unknown>;
  summary?: Record<string, number | string>;
  rows?: Array<Record<string, string | number | undefined>>;
  widgets?: ReportWidget[];
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface ScheduleReportPayload {
  definitionCode: string;
  cron: string;
  parameters?: Record<string, unknown>;
  recipients?: string[];
}

export interface ScheduledReport {
  id: string;
  definitionCode: string;
  cron: string;
  parameters?: Record<string, unknown>;
  recipients?: string[];
  status: string;
  createdAt: string;
}

export interface AnalyticsChart {
  id: string;
  title: string;
  type: WidgetType;
  data: Record<string, unknown>;
}

export interface AnalyticsTable {
  id: string;
  title: string;
  columns: string[];
  rows: Array<Record<string, unknown>>;
}

export interface AnalyticsResponse {
  domain: string;
  metrics: Record<string, number | string>;
  charts: AnalyticsChart[];
  tables?: AnalyticsTable[];
}

export interface ListDefinitionsParams extends ReportFilterParams {
  domain?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}

export interface ListRunsParams extends ReportFilterParams {
  domain?: string;
  status?: ReportRunStatus;
  page?: number;
  pageSize?: number;
}

export interface ExportReportParams extends ReportFilterParams {
  domain: string;
  type: string;
  format: ExportFormat;
  parameters?: Record<string, unknown>;
}

async function unwrap<T>(response: { data: ApiSuccessResponse<T> }): Promise<T> {
  return response.data.data;
}

export async function fetchReportDefinitions(
  params: ListDefinitionsParams = {},
): Promise<PaginatedResult<ReportDefinition>> {
  const response = await apiClient.get<
    ApiSuccessResponse<{ reports: Array<{ id: string; domain: string; type: string; title: string; description: string; exportable: boolean }> }>
  >(`${REPORTS_PREFIX}/search`, {
    params: { q: params.search ?? '', role: params.domain },
  });
  const reports = response.data.data.reports
    .filter((report) => !params.domain || report.domain === params.domain)
    .map((report) => ({
      code: `${report.domain}.${report.type}`,
      name: report.title,
      description: report.description,
      domain: report.domain,
      parameters: [],
      supportsExport: report.exportable,
    }));
  return {
    items: reports,
    pagination: { page: 1, pageSize: reports.length, total: reports.length, totalPages: 1 },
  };
}

export async function fetchReportDefinition(code: string): Promise<ReportDefinition> {
  const [domain, type] = code.includes('.') ? code.split('.', 2) : ['operations', code];
  const definitions = await fetchReportDefinitions({ search: type, domain });
  const match = definitions.items.find((item) => item.code === code);
  if (!match) {
    return { code, name: type, domain, parameters: [], supportsExport: true };
  }
  return match;
}

export async function runReport(payload: RunReportPayload): Promise<ReportRunResult> {
  const response = await apiClient.get<ApiSuccessResponse<Record<string, unknown>>>(`${REPORTS_PREFIX}/reports`, {
    params: {
      domain: payload.domain,
      type: payload.type,
      ...payload.parameters,
    },
  });
  return {
    id: `${payload.domain}:${payload.type}`,
    domain: payload.domain,
    type: payload.type,
    status: 'completed',
    summary: response.data.data as Record<string, number | string>,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };
}

export async function fetchReportRuns(_params: ListRunsParams = {}): Promise<PaginatedResult<ReportRunResult>> {
  return { items: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } };
}

export async function fetchReportRun(id: string): Promise<ReportRunResult> {
  const [domain, type] = id.split(':');
  return runReport({ domain, type, format: 'json' });
}

export async function scheduleReport(payload: ScheduleReportPayload): Promise<ScheduledReport> {
  return {
    id: payload.definitionCode,
    definitionCode: payload.definitionCode,
    cron: payload.cron,
    parameters: payload.parameters,
    recipients: payload.recipients,
    status: 'scheduled',
    createdAt: new Date().toISOString(),
  };
}

export async function fetchExecutiveDashboard(params: ReportFilterParams = {}): Promise<DashboardResponse> {
  const response = await apiClient.get<ApiSuccessResponse<DashboardResponse>>(
    `${REPORTS_PREFIX}/dashboard/executive`,
    { params },
  );
  return unwrap(response);
}

export async function fetchRoleDashboard(
  role: DashboardRole | string,
  params: ReportFilterParams = {},
): Promise<DashboardResponse> {
  const response = await apiClient.get<ApiSuccessResponse<DashboardResponse>>(
    `${REPORTS_PREFIX}/dashboard/${role}`,
    { params },
  );
  return unwrap(response);
}

export async function fetchDashboardConfig(role?: string): Promise<DashboardConfig> {
  const dashboard = role
    ? await fetchRoleDashboard(role)
    : await fetchExecutiveDashboard();
  return {
    role: dashboard.role,
    layout: dashboard.widgets.map((widget, index) => ({
      widgetId: widget.id,
      colSpan: widget.colSpan ?? 2,
      order: index,
      visible: true,
    })),
  };
}

export async function saveDashboardConfig(payload: DashboardConfig): Promise<DashboardConfig> {
  return payload;
}

export async function fetchDomainAnalytics(
  domain: ReportDomain | string,
  params: ReportFilterParams = {},
): Promise<AnalyticsResponse> {
  const response = await apiClient.get<ApiSuccessResponse<AnalyticsResponse>>(
    `${REPORTS_PREFIX}/analytics/${domain}`,
    { params },
  );
  return unwrap(response);
}

export async function exportReport(params: ExportReportParams): Promise<Blob> {
  const response = await apiClient.get(`${REPORTS_PREFIX}/reports/export`, { params, responseType: 'blob' });
  return response.data as Blob;
}
