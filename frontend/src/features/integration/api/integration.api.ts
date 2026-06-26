import apiClient from '@/shared/api/axios.client';
import type { ApiSuccessResponse, PaginatedResult, PaginationMeta } from '@/shared/types/api.types';

const INTEGRATION_PREFIX = '/api/v1/integration';

export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'pending' | 'disabled';
export type ConnectorProvider = 'cloudinary' | 'smtp' | 'rest_api' | 'slack' | 'google_calendar' | string;
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type WebhookDeliveryStatus = 'pending' | 'delivered' | 'failed' | 'retrying';
export type ExportFormat = 'csv' | 'xlsx' | 'json' | 'pdf';
export type BackupStatus = 'pending' | 'running' | 'completed' | 'failed' | 'verified';

export interface IntegrationDashboard {
  connectedServices: number;
  failedIntegrations: number;
  webhookActivity24h: number;
  apiUsage24h: number;
  importJobsToday: number;
  exportJobsToday: number;
  schedulerActiveJobs: number;
  schedulerFailedJobs: number;
  storageUsedMb: number;
  storageQuotaMb: number;
  emailQueuePending: number;
  emailQueueFailed: number;
  recentFailures: IntegrationFailureSummary[];
  updatedAt: string;
}

export interface IntegrationFailureSummary {
  id: string;
  source: string;
  message: string;
  occurredAt: string;
}

export interface Connector {
  id: string;
  provider: ConnectorProvider;
  name: string;
  status: IntegrationStatus;
  enabled: boolean;
  config: Record<string, unknown>;
  lastTestedAt?: string;
  lastSyncAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConnectorPayload {
  provider: ConnectorProvider;
  name: string;
  config: Record<string, unknown>;
  enabled?: boolean;
}

export interface UpdateConnectorPayload {
  name?: string;
  config?: Record<string, unknown>;
  enabled?: boolean;
}

export interface ConnectorTestResult {
  success: boolean;
  latencyMs?: number;
  message?: string;
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  permissions: string[];
  rateLimitPerMinute?: number;
  expiresAt?: string;
  lastUsedAt?: string;
  status: 'active' | 'revoked' | 'expired';
  createdAt: string;
  createdBy?: string;
}

export interface CreateApiKeyPayload {
  name: string;
  permissions: string[];
  rateLimitPerMinute?: number;
  expiresAt?: string;
}

export interface UpdateApiKeyPayload {
  name?: string;
  permissions?: string[];
  rateLimitPerMinute?: number;
  expiresAt?: string;
}

export interface ApiKeyCreated extends ApiKey {
  secret: string;
}

export interface ApiKeyUsageLog {
  id: string;
  apiKeyId: string;
  method: string;
  path: string;
  statusCode: number;
  ip?: string;
  timestamp: string;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  enabled: boolean;
  secret?: string;
  retryPolicy: WebhookRetryPolicy;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookRetryPolicy {
  maxAttempts: number;
  backoffSeconds: number;
}

export interface CreateWebhookPayload {
  name: string;
  url: string;
  events: string[];
  enabled?: boolean;
  retryPolicy?: WebhookRetryPolicy;
}

export interface UpdateWebhookPayload {
  name?: string;
  url?: string;
  events?: string[];
  enabled?: boolean;
  retryPolicy?: WebhookRetryPolicy;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  status: WebhookDeliveryStatus;
  statusCode?: number;
  attempt: number;
  responseBody?: string;
  errorMessage?: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface ImportModule {
  key: string;
  label: string;
  description?: string;
  fields: string[];
}

export interface ImportPreviewRow {
  rowNumber: number;
  data: Record<string, string>;
  errors?: string[];
  isDuplicate?: boolean;
}

export interface ImportPreviewResult {
  module: string;
  totalRows: number;
  validRows: number;
  errorRows: number;
  duplicateRows: number;
  rows: ImportPreviewRow[];
}

export interface ImportJob {
  id: string;
  module: string;
  fileName: string;
  status: JobStatus;
  totalRows: number;
  processedRows: number;
  errorRows: number;
  errors?: Array<{ row: number; message: string }>;
  createdAt: string;
  completedAt?: string;
}

export interface ExportJob {
  id: string;
  module: string;
  format: ExportFormat;
  status: JobStatus;
  filters?: Record<string, unknown>;
  fileName?: string;
  fileSizeBytes?: number;
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
}

export interface CreateExportPayload {
  module: string;
  format: ExportFormat;
  filters?: Record<string, unknown>;
}

export interface SchedulerJob {
  id: string;
  name: string;
  cron: string;
  handler: string;
  enabled: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  lastStatus?: JobStatus;
  createdAt: string;
}

export interface SchedulerJobHistory {
  id: string;
  jobId: string;
  status: JobStatus;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  errorMessage?: string;
}

export interface IntegrationLogEntry {
  id: string;
  level: LogLevel;
  source: string;
  category: string;
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface BackupRecord {
  id: string;
  type: 'manual' | 'scheduled';
  status: BackupStatus;
  sizeBytes?: number;
  verified: boolean;
  verifiedAt?: string;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface ListParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface LogListParams extends ListParams {
  level?: LogLevel;
  source?: string;
  category?: string;
  from?: string;
  to?: string;
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

export async function fetchIntegrationDashboard(): Promise<IntegrationDashboard> {
  const response = await apiClient.get<ApiSuccessResponse<IntegrationDashboard>>(
    `${INTEGRATION_PREFIX}/dashboard`,
  );
  return unwrap(response);
}

export async function fetchConnectors(): Promise<Connector[]> {
  const response = await apiClient.get<ApiSuccessResponse<Connector[]>>(`${INTEGRATION_PREFIX}/connectors`);
  return unwrap(response);
}

export async function fetchConnector(id: string): Promise<Connector> {
  const response = await apiClient.get<ApiSuccessResponse<Connector>>(`${INTEGRATION_PREFIX}/connectors/${id}`);
  return unwrap(response);
}

export async function createConnector(payload: CreateConnectorPayload): Promise<Connector> {
  const response = await apiClient.post<ApiSuccessResponse<Connector>>(
    `${INTEGRATION_PREFIX}/connectors`,
    payload,
  );
  return unwrap(response);
}

export async function updateConnector(id: string, payload: UpdateConnectorPayload): Promise<Connector> {
  const response = await apiClient.patch<ApiSuccessResponse<Connector>>(
    `${INTEGRATION_PREFIX}/connectors/${id}`,
    payload,
  );
  return unwrap(response);
}

export async function deleteConnector(id: string): Promise<void> {
  await apiClient.delete(`${INTEGRATION_PREFIX}/connectors/${id}`);
}

export async function testConnector(id: string): Promise<ConnectorTestResult> {
  const response = await apiClient.post<ApiSuccessResponse<ConnectorTestResult>>(
    `${INTEGRATION_PREFIX}/connectors/${id}/test`,
  );
  return unwrap(response);
}

export async function toggleConnector(id: string, enabled: boolean): Promise<Connector> {
  const response = await apiClient.post<ApiSuccessResponse<Connector>>(
    `${INTEGRATION_PREFIX}/connectors/${id}/toggle`,
    { enabled },
  );
  return unwrap(response);
}

export async function fetchApiKeys(params: ListParams = {}): Promise<PaginatedResult<ApiKey>> {
  const response = await apiClient.get<ApiSuccessResponse<ApiKey[]> & { pagination?: PaginationMeta }>(
    `${INTEGRATION_PREFIX}/api-keys`,
    { params },
  );
  return unwrapPaginated(response);
}

export async function fetchApiKey(id: string): Promise<ApiKey> {
  const response = await apiClient.get<ApiSuccessResponse<ApiKey>>(`${INTEGRATION_PREFIX}/api-keys/${id}`);
  return unwrap(response);
}

export async function createApiKey(payload: CreateApiKeyPayload): Promise<ApiKeyCreated> {
  const response = await apiClient.post<ApiSuccessResponse<ApiKeyCreated>>(
    `${INTEGRATION_PREFIX}/api-keys`,
    payload,
  );
  return unwrap(response);
}

export async function updateApiKey(id: string, payload: UpdateApiKeyPayload): Promise<ApiKey> {
  const response = await apiClient.patch<ApiSuccessResponse<ApiKey>>(
    `${INTEGRATION_PREFIX}/api-keys/${id}`,
    payload,
  );
  return unwrap(response);
}

export async function revokeApiKey(id: string): Promise<ApiKey> {
  const response = await apiClient.post<ApiSuccessResponse<ApiKey>>(
    `${INTEGRATION_PREFIX}/api-keys/${id}/revoke`,
  );
  return unwrap(response);
}

export async function rotateApiKey(id: string): Promise<ApiKeyCreated> {
  const response = await apiClient.post<ApiSuccessResponse<ApiKeyCreated>>(
    `${INTEGRATION_PREFIX}/api-keys/${id}/rotate`,
  );
  return unwrap(response);
}

export async function regenerateApiKey(id: string): Promise<ApiKeyCreated> {
  const response = await apiClient.post<ApiSuccessResponse<ApiKeyCreated>>(
    `${INTEGRATION_PREFIX}/api-keys/${id}/regenerate`,
  );
  return unwrap(response);
}

export async function fetchApiKeyUsage(
  id: string,
  params: ListParams = {},
): Promise<PaginatedResult<ApiKeyUsageLog>> {
  const response = await apiClient.get<ApiSuccessResponse<ApiKeyUsageLog[]> & { pagination?: PaginationMeta }>(
    `${INTEGRATION_PREFIX}/api-keys/${id}/usage`,
    { params },
  );
  return unwrapPaginated(response);
}

export async function fetchWebhooks(params: ListParams = {}): Promise<PaginatedResult<Webhook>> {
  const response = await apiClient.get<ApiSuccessResponse<Webhook[]> & { pagination?: PaginationMeta }>(
    `${INTEGRATION_PREFIX}/webhooks`,
    { params },
  );
  return unwrapPaginated(response);
}

export async function fetchWebhook(id: string): Promise<Webhook> {
  const response = await apiClient.get<ApiSuccessResponse<Webhook>>(`${INTEGRATION_PREFIX}/webhooks/${id}`);
  return unwrap(response);
}

export async function createWebhook(payload: CreateWebhookPayload): Promise<Webhook> {
  const response = await apiClient.post<ApiSuccessResponse<Webhook>>(
    `${INTEGRATION_PREFIX}/webhooks`,
    payload,
  );
  return unwrap(response);
}

export async function updateWebhook(id: string, payload: UpdateWebhookPayload): Promise<Webhook> {
  const response = await apiClient.patch<ApiSuccessResponse<Webhook>>(
    `${INTEGRATION_PREFIX}/webhooks/${id}`,
    payload,
  );
  return unwrap(response);
}

export async function deleteWebhook(id: string): Promise<void> {
  await apiClient.delete(`${INTEGRATION_PREFIX}/webhooks/${id}`);
}

export async function fetchWebhookDeliveries(
  webhookId: string,
  params: ListParams = {},
): Promise<PaginatedResult<WebhookDelivery>> {
  const response = await apiClient.get<ApiSuccessResponse<WebhookDelivery[]> & { pagination?: PaginationMeta }>(
    `${INTEGRATION_PREFIX}/webhooks/${webhookId}/deliveries`,
    { params },
  );
  return unwrapPaginated(response);
}

export async function testWebhook(id: string, event?: string): Promise<WebhookDelivery> {
  const response = await apiClient.post<ApiSuccessResponse<WebhookDelivery>>(
    `${INTEGRATION_PREFIX}/webhooks/${id}/test`,
    event ? { event } : {},
  );
  return unwrap(response);
}

export async function retryWebhookDelivery(webhookId: string, deliveryId: string): Promise<WebhookDelivery> {
  const response = await apiClient.post<ApiSuccessResponse<WebhookDelivery>>(
    `${INTEGRATION_PREFIX}/webhooks/${webhookId}/deliveries/${deliveryId}/retry`,
  );
  return unwrap(response);
}

export async function fetchImportModules(): Promise<ImportModule[]> {
  const response = await apiClient.get<ApiSuccessResponse<ImportModule[]>>(`${INTEGRATION_PREFIX}/import/modules`);
  return unwrap(response);
}

export async function previewImport(module: string, file: File): Promise<ImportPreviewResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('module', module);
  const response = await apiClient.post<ApiSuccessResponse<ImportPreviewResult>>(
    `${INTEGRATION_PREFIX}/import/preview`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return unwrap(response);
}

export async function executeImport(module: string, file: File): Promise<ImportJob> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('module', module);
  const response = await apiClient.post<ApiSuccessResponse<ImportJob>>(
    `${INTEGRATION_PREFIX}/import/execute`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return unwrap(response);
}

export async function fetchImportHistory(params: ListParams = {}): Promise<PaginatedResult<ImportJob>> {
  const response = await apiClient.get<ApiSuccessResponse<ImportJob[]> & { pagination?: PaginationMeta }>(
    `${INTEGRATION_PREFIX}/import/history`,
    { params },
  );
  return unwrapPaginated(response);
}

export async function fetchImportJob(id: string): Promise<ImportJob> {
  const response = await apiClient.get<ApiSuccessResponse<ImportJob>>(`${INTEGRATION_PREFIX}/import/jobs/${id}`);
  return unwrap(response);
}

export async function createExportJob(payload: CreateExportPayload): Promise<ExportJob> {
  const response = await apiClient.post<ApiSuccessResponse<ExportJob>>(
    `${INTEGRATION_PREFIX}/export`,
    payload,
  );
  return unwrap(response);
}

export async function fetchExportHistory(params: ListParams = {}): Promise<PaginatedResult<ExportJob>> {
  const response = await apiClient.get<ApiSuccessResponse<ExportJob[]> & { pagination?: PaginationMeta }>(
    `${INTEGRATION_PREFIX}/export/history`,
    { params },
  );
  return unwrapPaginated(response);
}

export async function fetchExportJob(id: string): Promise<ExportJob> {
  const response = await apiClient.get<ApiSuccessResponse<ExportJob>>(`${INTEGRATION_PREFIX}/export/jobs/${id}`);
  return unwrap(response);
}

export async function downloadExport(id: string): Promise<Blob> {
  const response = await apiClient.get(`${INTEGRATION_PREFIX}/export/jobs/${id}/download`, {
    responseType: 'blob',
  });
  return response.data as Blob;
}

export async function fetchSchedulerJobs(): Promise<SchedulerJob[]> {
  const response = await apiClient.get<ApiSuccessResponse<SchedulerJob[]>>(`${INTEGRATION_PREFIX}/scheduler/jobs`);
  return unwrap(response);
}

export async function toggleSchedulerJob(id: string, enabled: boolean): Promise<SchedulerJob> {
  const response = await apiClient.post<ApiSuccessResponse<SchedulerJob>>(
    `${INTEGRATION_PREFIX}/scheduler/jobs/${id}/toggle`,
    { enabled },
  );
  return unwrap(response);
}

export async function fetchSchedulerJobHistory(
  jobId: string,
  params: ListParams = {},
): Promise<PaginatedResult<SchedulerJobHistory>> {
  const response = await apiClient.get<ApiSuccessResponse<SchedulerJobHistory[]> & { pagination?: PaginationMeta }>(
    `${INTEGRATION_PREFIX}/scheduler/jobs/${jobId}/history`,
    { params },
  );
  return unwrapPaginated(response);
}

export async function fetchSchedulerFailures(params: ListParams = {}): Promise<PaginatedResult<SchedulerJobHistory>> {
  const response = await apiClient.get<ApiSuccessResponse<SchedulerJobHistory[]> & { pagination?: PaginationMeta }>(
    `${INTEGRATION_PREFIX}/scheduler/failures`,
    { params },
  );
  return unwrapPaginated(response);
}

export async function fetchIntegrationLogs(params: LogListParams = {}): Promise<PaginatedResult<IntegrationLogEntry>> {
  const response = await apiClient.get<ApiSuccessResponse<IntegrationLogEntry[]> & { pagination?: PaginationMeta }>(
    `${INTEGRATION_PREFIX}/logs`,
    { params },
  );
  return unwrapPaginated(response);
}

export async function fetchBackups(params: ListParams = {}): Promise<PaginatedResult<BackupRecord>> {
  const response = await apiClient.get<ApiSuccessResponse<BackupRecord[]> & { pagination?: PaginationMeta }>(
    `${INTEGRATION_PREFIX}/backups`,
    { params },
  );
  return unwrapPaginated(response);
}

export async function createBackup(): Promise<BackupRecord> {
  const response = await apiClient.post<ApiSuccessResponse<BackupRecord>>(`${INTEGRATION_PREFIX}/backups`);
  return unwrap(response);
}

export async function verifyBackup(id: string): Promise<BackupRecord> {
  const response = await apiClient.post<ApiSuccessResponse<BackupRecord>>(
    `${INTEGRATION_PREFIX}/backups/${id}/verify`,
  );
  return unwrap(response);
}
