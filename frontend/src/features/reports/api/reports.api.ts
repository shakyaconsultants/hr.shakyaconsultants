import apiClient from '@/shared/api/axios.client';
import type { ApiSuccessResponse, PaginatedResult, PaginationMeta } from '@/shared/types/api.types';

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

async function unwrapPaginated<T>(response: {
  data: ApiSuccessResponse<T[]> & { pagination?: PaginationMeta };
}): Promise<PaginatedResult<T>> {
  const { data } = response;
  return {
    items: data.data,
    pagination: data.pagination ?? { page: 1, pageSize: 20, total: data.data.length, totalPages: 1 },
  };
}

export async function fetchReportDefinitions(
  params: ListDefinitionsParams = {},
): Promise<PaginatedResult<ReportDefinition>> {
  const response = await apiClient.get<ApiSuccessResponse<ReportDefinition[]> & { pagination?: PaginationMeta }>(
    `${REPORTS_PREFIX}/definitions`,
    { params },
  );
  return unwrapPaginated(response);
}

export async function fetchReportDefinition(code: string): Promise<ReportDefinition> {
  const response = await apiClient.get<ApiSuccessResponse<ReportDefinition>>(`${REPORTS_PREFIX}/definitions/${code}`);
  return unwrap(response);
}

export async function runReport(payload: RunReportPayload): Promise<ReportRunResult> {
  const response = await apiClient.post<ApiSuccessResponse<ReportRunResult>>(`${REPORTS_PREFIX}/run`, payload);
  return unwrap(response);
}

export async function fetchReportRuns(params: ListRunsParams = {}): Promise<PaginatedResult<ReportRunResult>> {
  const response = await apiClient.get<ApiSuccessResponse<ReportRunResult[]> & { pagination?: PaginationMeta }>(
    `${REPORTS_PREFIX}/runs`,
    { params },
  );
  return unwrapPaginated(response);
}

export async function fetchReportRun(id: string): Promise<ReportRunResult> {
  const response = await apiClient.get<ApiSuccessResponse<ReportRunResult>>(`${REPORTS_PREFIX}/runs/${id}`);
  return unwrap(response);
}

export async function scheduleReport(payload: ScheduleReportPayload): Promise<ScheduledReport> {
  const response = await apiClient.post<ApiSuccessResponse<ScheduledReport>>(`${REPORTS_PREFIX}/schedules`, payload);
  return unwrap(response);
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
  const response = await apiClient.get<ApiSuccessResponse<DashboardConfig>>(`${REPORTS_PREFIX}/dashboard/config`, {
    params: role ? { role } : undefined,
  });
  return unwrap(response);
}

export async function saveDashboardConfig(payload: DashboardConfig): Promise<DashboardConfig> {
  const response = await apiClient.put<ApiSuccessResponse<DashboardConfig>>(
    `${REPORTS_PREFIX}/dashboard/config`,
    payload,
  );
  return unwrap(response);
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
  const response = await apiClient.get(`${REPORTS_PREFIX}/export`, { params, responseType: 'blob' });
  return response.data as Blob;
}
