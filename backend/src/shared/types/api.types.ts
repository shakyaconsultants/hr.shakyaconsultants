export interface ApiMeta {
  correlationId: string;
  requestId?: string;
  timestamp: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccessResponse<T> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  meta: ApiMeta;
  pagination?: PaginationMeta;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details: unknown[];
  metadata: Record<string, unknown>;
  correlationId: string;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  error: ApiErrorBody;
  meta: ApiMeta;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface HealthCheckData {
  mongodb: 'healthy' | 'unhealthy';
  email: 'direct' | 'unconfigured';
}

export interface UploadMetadata {
  publicId: string;
  url: string;
  secureUrl: string;
  resourceType: string;
  format: string;
  bytes: number;
  folder: string;
  originalFilename: string;
  mimeType: string;
}

export interface EmailJobPayload {
  templateType: string;
  to: string;
  subject: string;
  data: Record<string, unknown>;
  correlationId: string;
  tenantId?: string;
}

export interface NotificationPayload {
  channel: string;
  recipientId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  correlationId: string;
  tenantId?: string;
}

export interface AuditLogEntry {
  who: string;
  when: string;
  where: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  ip?: string;
  device?: string;
  correlationId: string;
  tenantId?: string;
}

export interface QueueJobContext {
  correlationId: string;
  tenantId?: string;
  userId?: string;
  attempt: number;
}
