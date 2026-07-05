import apiClient from '@/shared/api/axios.client';
import { isAxiosError } from 'axios';
import type { ApiSuccessResponse, PaginatedResult, PaginationMeta } from '@/shared/types/api.types';

const SALES_PREFIX = '/api/v1/sales';

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  probability?: number;
}

export interface Pipeline {
  id: string;
  name: string;
  description?: string;
  stages: PipelineStage[];
  isDefault: boolean;
  status: string;
}

export interface LeadSource {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: string;
}

export interface SalesTeam {
  id: string;
  name: string;
  code: string;
  managerEmployeeId: string;
  managerName?: string;
  memberEmployeeIds: string[];
  territoryId?: string;
  status: string;
}

export interface Territory {
  id: string;
  name: string;
  code: string;
  branchId?: string;
  region?: string;
  assignedEmployeeIds: string[];
  status: string;
}

export interface SalesTarget {
  id: string;
  employeeId?: string;
  teamId?: string;
  periodStart: string;
  periodEnd: string;
  targetValue: number;
  achievedValue: number;
  currency: string;
  status: string;
}

export interface SalesPolicy {
  assignmentRules: Record<string, unknown>;
  scoringRules: Record<string, unknown>;
  autoAssignEnabled: boolean;
  defaultPipelineId?: string;
  followUpReminderDays: number;
  currency: string;
}

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  company?: string;
  email: string;
  phone?: string;
  source?: string;
  sourceId?: string;
  status: string;
  priority?: string;
  score?: number;
  estimatedValue?: number;
  dealValue?: number;
  currency?: string;
  assignedToId?: string;
  assignedToName?: string;
  pipelineId?: string;
  stageId?: string;
  territoryId?: string;
  teamId?: string;
  tags?: string[];
  notes?: string;
  internalNotes?: string;
  lostReason?: string;
  wonReason?: string;
  expectedCloseDate?: string;
  lastActivityAt?: string;
  attachmentUrls?: string[];
  createdAt?: string;
}

export interface LeadActivity {
  id: string;
  leadId: string;
  type: string;
  title?: string;
  description: string;
  performedBy: string;
  performedByName?: string;
  performedAt: string;
  metadata?: Record<string, unknown>;
  attachmentUrls?: string[];
  fromStageId?: string;
  toStageId?: string;
}

export interface CallLog {
  id: string;
  leadId?: string;
  dealId?: string;
  employeeId: string;
  employeeName?: string;
  direction: 'inbound' | 'outbound';
  durationSeconds: number;
  outcome?: string;
  notes?: string;
  calledAt: string;
}

export interface FollowUp {
  id: string;
  leadId?: string;
  dealId?: string;
  assignedToId: string;
  assignedToName?: string;
  scheduledAt: string;
  completedAt?: string;
  status: string;
  notes?: string;
}

export interface Deal {
  id: string;
  leadId?: string;
  name: string;
  value: number;
  currency: string;
  status: string;
  expectedCloseDate?: string;
  ownerId: string;
  ownerName?: string;
  pipelineId?: string;
  stageId?: string;
  closedAt?: string;
  lostReason?: string;
  wonReason?: string;
  tags?: string[];
  priority?: string;
  teamId?: string;
}

export interface LeadKanbanColumn {
  stageId: string;
  stageName: string;
  order: number;
  leads: Lead[];
}

export interface LeadKanbanBoard {
  pipelineId: string;
  pipelineName: string;
  columns: LeadKanbanColumn[];
}

export interface EnterpriseSalesDashboard {
  totalLeads: number;
  openLeads: number;
  wonDeals: number;
  lostDeals: number;
  pipelineValue: number;
  conversionRate: number;
  activeTeams: number;
  overdueFollowUps: number;
}

export interface ManagerSalesDashboard {
  teamLeads: number;
  openLeads: number;
  wonThisMonth: number;
  lostThisMonth: number;
  pendingFollowUps: number;
  overdueFollowUps: number;
  teamTargetProgress?: number;
}

export interface ExecutiveSalesDashboard {
  myLeads: number;
  openLeads: number;
  followUpsToday: number;
  callsToday: number;
  meetingsToday: number;
  wonThisMonth: number;
  targetProgress?: number;
}

export interface SalesReportRow {
  [key: string]: string | number | undefined;
}

export interface SalesReport {
  type: string;
  period: string;
  scope: string;
  rows: SalesReportRow[];
  summary: Record<string, number>;
}

export interface ConversionAnalytics {
  stages: Array<{ stageId: string; stageName: string; count: number; conversionRate: number }>;
  totalLeads: number;
  wonCount: number;
  lostCount: number;
}

export interface RevenueAnalytics {
  periods: Array<{ label: string; revenue: number; dealCount: number }>;
  totalRevenue: number;
  averageDealSize: number;
}

export interface ListParams {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
  assignedToId?: string;
  pipelineId?: string;
  stageId?: string;
  teamId?: string;
  sourceId?: string;
  priority?: string;
}

export interface ReportParams {
  type: 'source' | 'executive' | 'pipeline' | 'conversion' | 'revenue' | 'activity' | 'follow_up';
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  scope: 'company' | 'team' | 'executive' | 'source' | 'pipeline';
  startDate: string;
  endDate: string;
  teamId?: string;
  employeeId?: string;
  pipelineId?: string;
  sourceId?: string;
}

export interface CreateLeadPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  sourceId?: string;
  estimatedValue?: number;
  currency?: string;
  pipelineId?: string;
  stageId?: string;
  notes?: string;
  tags?: string[];
  priority?: string;
}

export interface UpdateLeadPayload extends Partial<CreateLeadPayload> {
  status?: string;
  assignedToId?: string;
  lostReason?: string;
  wonReason?: string;
  expectedCloseDate?: string;
}

export interface AssignLeadPayload {
  assignedToId: string;
  assignmentType?: 'manual' | 'automatic' | 'territory' | 'manager_override';
  reason?: string;
  teamId?: string;
}

export interface MoveStagePayload {
  stageId: string;
  pipelineId?: string;
}

export interface CreateActivityPayload {
  leadId: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'status_change';
  title?: string;
  description: string;
  metadata?: Record<string, unknown>;
  attachmentUrls?: string[];
}

export interface CreatePipelinePayload {
  name: string;
  description?: string;
  stages: PipelineStage[];
  isDefault?: boolean;
}

export interface CreateLeadSourcePayload {
  name: string;
  code: string;
  description?: string;
}

export interface CreateSalesTeamPayload {
  name: string;
  code: string;
  managerEmployeeId: string;
  memberEmployeeIds?: string[];
  territoryId?: string;
}

export interface CreateTerritoryPayload {
  name: string;
  code: string;
  branchId?: string;
  region?: string;
  assignedEmployeeIds?: string[];
}

export interface CreateSalesTargetPayload {
  employeeId?: string;
  teamId?: string;
  periodStart: string;
  periodEnd: string;
  targetValue: number;
  currency?: string;
}

export interface CreateCallLogPayload {
  leadId?: string;
  direction: 'inbound' | 'outbound';
  durationSeconds: number;
  outcome?: string;
  notes?: string;
  calledAt?: string;
}

export interface CreateFollowUpPayload {
  leadId: string;
  scheduledAt: string;
  notes?: string;
  assignedToId?: string;
}

async function unwrap<T>(response: { data: ApiSuccessResponse<T> }): Promise<T> {
  return response.data.data;
}

async function unwrapPaginated<T>(response: {
  data: ApiSuccessResponse<T[]> | ApiSuccessResponse<PaginatedResult<T>>;
}): Promise<PaginatedResult<T>> {
  const data = response.data?.data as any;
  if (data && 'items' in data && 'pagination' in data) {
    return data as PaginatedResult<T>;
  }
  const items = Array.isArray(data) ? data : (data?.items ?? []);
  const pagination = (response.data as any)?.pagination ?? data?.pagination ?? { page: 1, pageSize: 20, total: items.length, totalPages: 1 };
  return { items, pagination };
}

export async function fetchEnterpriseSalesDashboard(): Promise<EnterpriseSalesDashboard> {
  const response = await apiClient.get<ApiSuccessResponse<EnterpriseSalesDashboard>>(`${SALES_PREFIX}/dashboard/enterprise`);
  return unwrap(response);
}

export async function fetchManagerSalesDashboard(): Promise<ManagerSalesDashboard> {
  const response = await apiClient.get<ApiSuccessResponse<ManagerSalesDashboard>>(`${SALES_PREFIX}/dashboard/manager`);
  return unwrap(response);
}

export async function fetchExecutiveSalesDashboard(): Promise<ExecutiveSalesDashboard> {
  const response = await apiClient.get<ApiSuccessResponse<ExecutiveSalesDashboard>>(`${SALES_PREFIX}/dashboard/executive`);
  return unwrap(response);
}

export async function fetchSalesPolicy(): Promise<SalesPolicy> {
  const response = await apiClient.get<ApiSuccessResponse<SalesPolicy>>(`${SALES_PREFIX}/policies`);
  return unwrap(response);
}

export async function updateSalesPolicy(payload: Partial<SalesPolicy>): Promise<SalesPolicy> {
  const response = await apiClient.patch<ApiSuccessResponse<SalesPolicy>>(`${SALES_PREFIX}/policies`, payload);
  return unwrap(response);
}

export async function fetchPipelines(params: ListParams = {}): Promise<PaginatedResult<Pipeline>> {
  const response = await apiClient.get<ApiSuccessResponse<Pipeline[]> & { pagination?: PaginationMeta }>(
    `${SALES_PREFIX}/pipelines`,
    { params },
  );
  return unwrapPaginated(response);
}

export async function fetchPipeline(id: string): Promise<Pipeline> {
  const response = await apiClient.get<ApiSuccessResponse<Pipeline>>(`${SALES_PREFIX}/pipelines/${id}`);
  return unwrap(response);
}

export async function createPipeline(payload: CreatePipelinePayload): Promise<Pipeline> {
  const response = await apiClient.post<ApiSuccessResponse<Pipeline>>(`${SALES_PREFIX}/pipelines`, payload);
  return unwrap(response);
}

export async function updatePipeline(id: string, payload: Partial<CreatePipelinePayload>): Promise<Pipeline> {
  const response = await apiClient.patch<ApiSuccessResponse<Pipeline>>(`${SALES_PREFIX}/pipelines/${id}`, payload);
  return unwrap(response);
}

export async function deletePipeline(id: string): Promise<void> {
  await apiClient.delete(`${SALES_PREFIX}/pipelines/${id}`);
}

export async function fetchLeadSources(params: ListParams = {}): Promise<PaginatedResult<LeadSource>> {
  const response = await apiClient.get<ApiSuccessResponse<LeadSource[]> & { pagination?: PaginationMeta }>(
    `${SALES_PREFIX}/lead-sources`,
    { params },
  );
  return unwrapPaginated(response);
}

export async function createLeadSource(payload: CreateLeadSourcePayload): Promise<LeadSource> {
  const response = await apiClient.post<ApiSuccessResponse<LeadSource>>(`${SALES_PREFIX}/lead-sources`, payload);
  return unwrap(response);
}

export async function updateLeadSource(id: string, payload: Partial<CreateLeadSourcePayload>): Promise<LeadSource> {
  const response = await apiClient.patch<ApiSuccessResponse<LeadSource>>(`${SALES_PREFIX}/lead-sources/${id}`, payload);
  return unwrap(response);
}

export async function deleteLeadSource(id: string): Promise<void> {
  await apiClient.delete(`${SALES_PREFIX}/lead-sources/${id}`);
}

export async function fetchSalesTeams(params: ListParams = {}): Promise<PaginatedResult<SalesTeam>> {
  const response = await apiClient.get<ApiSuccessResponse<SalesTeam[]> & { pagination?: PaginationMeta }>(
    `${SALES_PREFIX}/sales-teams`,
    { params },
  );
  return unwrapPaginated(response);
}

export async function createSalesTeam(payload: CreateSalesTeamPayload): Promise<SalesTeam> {
  const response = await apiClient.post<ApiSuccessResponse<SalesTeam>>(`${SALES_PREFIX}/sales-teams`, payload);
  return unwrap(response);
}

export async function updateSalesTeam(id: string, payload: Partial<CreateSalesTeamPayload>): Promise<SalesTeam> {
  const response = await apiClient.patch<ApiSuccessResponse<SalesTeam>>(`${SALES_PREFIX}/sales-teams/${id}`, payload);
  return unwrap(response);
}

export async function deleteSalesTeam(id: string): Promise<void> {
  await apiClient.delete(`${SALES_PREFIX}/sales-teams/${id}`);
}

export async function fetchTerritories(params: ListParams = {}): Promise<PaginatedResult<Territory>> {
  const response = await apiClient.get<ApiSuccessResponse<Territory[]> & { pagination?: PaginationMeta }>(
    `${SALES_PREFIX}/territories`,
    { params },
  );
  return unwrapPaginated(response);
}

export async function createTerritory(payload: CreateTerritoryPayload): Promise<Territory> {
  const response = await apiClient.post<ApiSuccessResponse<Territory>>(`${SALES_PREFIX}/territories`, payload);
  return unwrap(response);
}

export async function updateTerritory(id: string, payload: Partial<CreateTerritoryPayload>): Promise<Territory> {
  const response = await apiClient.patch<ApiSuccessResponse<Territory>>(`${SALES_PREFIX}/territories/${id}`, payload);
  return unwrap(response);
}

export async function deleteTerritory(id: string): Promise<void> {
  await apiClient.delete(`${SALES_PREFIX}/territories/${id}`);
}

export async function fetchSalesTargets(params: ListParams = {}): Promise<PaginatedResult<SalesTarget>> {
  const response = await apiClient.get<ApiSuccessResponse<SalesTarget[]> & { pagination?: PaginationMeta }>(
    `${SALES_PREFIX}/sales-targets`,
    { params },
  );
  return unwrapPaginated(response);
}

export async function createSalesTarget(payload: CreateSalesTargetPayload): Promise<SalesTarget> {
  const response = await apiClient.post<ApiSuccessResponse<SalesTarget>>(`${SALES_PREFIX}/sales-targets`, payload);
  return unwrap(response);
}

export async function updateSalesTarget(id: string, payload: Partial<CreateSalesTargetPayload>): Promise<SalesTarget> {
  const response = await apiClient.patch<ApiSuccessResponse<SalesTarget>>(`${SALES_PREFIX}/sales-targets/${id}`, payload);
  return unwrap(response);
}

export async function deleteSalesTarget(id: string): Promise<void> {
  await apiClient.delete(`${SALES_PREFIX}/sales-targets/${id}`);
}

export async function fetchLeads(params: ListParams = {}): Promise<PaginatedResult<Lead>> {
  const response = await apiClient.get<ApiSuccessResponse<Lead[]> & { pagination?: PaginationMeta }>(
    `${SALES_PREFIX}/leads`,
    { params },
  );
  return unwrapPaginated(response);
}

export async function fetchMyLeads(params: ListParams = {}): Promise<PaginatedResult<Lead>> {
  const response = await apiClient.get<ApiSuccessResponse<Lead[]> & { pagination?: PaginationMeta }>(
    `${SALES_PREFIX}/leads/me`,
    { params },
  );
  return unwrapPaginated(response);
}

export async function fetchTeamLeads(params: ListParams = {}): Promise<PaginatedResult<Lead>> {
  const response = await apiClient.get<ApiSuccessResponse<Lead[]> & { pagination?: PaginationMeta }>(
    `${SALES_PREFIX}/leads/team`,
    { params },
  );
  return unwrapPaginated(response);
}

export async function fetchLead(id: string): Promise<Lead> {
  const response = await apiClient.get<ApiSuccessResponse<Lead>>(`${SALES_PREFIX}/leads/${id}`);
  return unwrap(response);
}

export async function createLead(payload: CreateLeadPayload): Promise<Lead> {
  const response = await apiClient.post<ApiSuccessResponse<Lead>>(`${SALES_PREFIX}/leads`, payload);
  return unwrap(response);
}

export async function updateLead(id: string, payload: UpdateLeadPayload): Promise<Lead> {
  const response = await apiClient.patch<ApiSuccessResponse<Lead>>(`${SALES_PREFIX}/leads/${id}`, payload);
  return unwrap(response);
}

export async function deleteLead(id: string): Promise<void> {
  await apiClient.delete(`${SALES_PREFIX}/leads/${id}`);
}

export async function assignLead(id: string, payload: AssignLeadPayload): Promise<Lead> {
  const response = await apiClient.post<ApiSuccessResponse<Lead>>(`${SALES_PREFIX}/leads/${id}/assign`, payload);
  return unwrap(response);
}

export async function moveLeadStage(id: string, payload: MoveStagePayload): Promise<Lead> {
  const response = await apiClient.post<ApiSuccessResponse<Lead>>(`${SALES_PREFIX}/leads/${id}/move-stage`, payload);
  return unwrap(response);
}

export async function fetchLeadTimeline(id: string): Promise<LeadActivity[]> {
  const response = await apiClient.get<ApiSuccessResponse<LeadActivity[]>>(`${SALES_PREFIX}/leads/${id}/timeline`);
  return unwrap(response);
}

export async function fetchLeadKanban(pipelineId?: string): Promise<LeadKanbanBoard> {
  try {
    const response = await apiClient.get<ApiSuccessResponse<LeadKanbanBoard>>(`${SALES_PREFIX}/leads/kanban`, {
      params: pipelineId ? { pipelineId } : undefined,
    });
    const board = await unwrap(response);
    return {
      pipelineId: board.pipelineId ?? '',
      pipelineName: board.pipelineName ?? 'Pipeline',
      columns: board.columns ?? [],
    };
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return { pipelineId: '', pipelineName: 'Pipeline', columns: [] };
    }
    throw error;
  }
}

export async function importLeads(file: File): Promise<{ imported: number; errors: string[] }> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post<ApiSuccessResponse<{ imported: number; errors: string[] }>>(
    `${SALES_PREFIX}/leads/import`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return unwrap(response);
}

export async function exportLeads(params: ListParams = {}): Promise<Blob> {
  const response = await apiClient.get(`${SALES_PREFIX}/leads/export`, { params, responseType: 'blob' });
  return response.data as Blob;
}

export async function fetchActivities(params: ListParams & { leadId?: string } = {}): Promise<PaginatedResult<LeadActivity>> {
  const response = await apiClient.get<ApiSuccessResponse<LeadActivity[]> & { pagination?: PaginationMeta }>(
    `${SALES_PREFIX}/activities`,
    { params },
  );
  return unwrapPaginated(response);
}

export async function createActivity(payload: CreateActivityPayload): Promise<LeadActivity> {
  const response = await apiClient.post<ApiSuccessResponse<LeadActivity>>(`${SALES_PREFIX}/activities`, payload);
  return unwrap(response);
}

export async function fetchCallLogs(params: ListParams & { leadId?: string } = {}): Promise<PaginatedResult<CallLog>> {
  const response = await apiClient.get<ApiSuccessResponse<CallLog[]> & { pagination?: PaginationMeta }>(
    `${SALES_PREFIX}/call-logs`,
    { params },
  );
  return unwrapPaginated(response);
}

export async function createCallLog(payload: CreateCallLogPayload): Promise<CallLog> {
  const response = await apiClient.post<ApiSuccessResponse<CallLog>>(`${SALES_PREFIX}/call-logs`, payload);
  return unwrap(response);
}

export async function fetchFollowUps(params: ListParams & { leadId?: string } = {}): Promise<PaginatedResult<FollowUp>> {
  const response = await apiClient.get<ApiSuccessResponse<FollowUp[]> & { pagination?: PaginationMeta }>(
    `${SALES_PREFIX}/follow-ups`,
    { params },
  );
  return unwrapPaginated(response);
}

export async function createFollowUp(payload: CreateFollowUpPayload): Promise<FollowUp> {
  const response = await apiClient.post<ApiSuccessResponse<FollowUp>>(`${SALES_PREFIX}/follow-ups`, payload);
  return unwrap(response);
}

export async function completeFollowUp(id: string): Promise<FollowUp> {
  const response = await apiClient.post<ApiSuccessResponse<FollowUp>>(`${SALES_PREFIX}/follow-ups/${id}/complete`);
  return unwrap(response);
}

export async function fetchDeals(params: ListParams = {}): Promise<PaginatedResult<Deal>> {
  const response = await apiClient.get<ApiSuccessResponse<Deal[]> & { pagination?: PaginationMeta }>(
    `${SALES_PREFIX}/deals`,
    { params },
  );
  return unwrapPaginated(response);
}

export async function fetchSalesReport(params: ReportParams): Promise<SalesReport> {
  const response = await apiClient.get<ApiSuccessResponse<SalesReport>>(`${SALES_PREFIX}/reports`, { params });
  return unwrap(response);
}

export async function exportSalesReport(params: ReportParams): Promise<Blob> {
  const response = await apiClient.get(`${SALES_PREFIX}/reports/export`, { params, responseType: 'blob' });
  return response.data as Blob;
}

export async function fetchConversionAnalytics(params: { startDate: string; endDate: string; pipelineId?: string }): Promise<ConversionAnalytics> {
  const response = await apiClient.get<ApiSuccessResponse<ConversionAnalytics>>(`${SALES_PREFIX}/analytics/conversion`, { params });
  return unwrap(response);
}

export async function fetchRevenueAnalytics(params: { startDate: string; endDate: string; teamId?: string }): Promise<RevenueAnalytics> {
  const response = await apiClient.get<ApiSuccessResponse<RevenueAnalytics>>(`${SALES_PREFIX}/analytics/revenue`, { params });
  return unwrap(response);
}
