import { Schema, type SchemaDefinition } from 'mongoose';
import { defineDomainModel } from '@infrastructure/database/model.factory.js';
import { COLLECTIONS } from '@infrastructure/database/constants/collections.js';
import type { BaseDocument } from '@infrastructure/database/types/base-document.types.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';

export const INTEGRATION_TYPE = {
  CLOUDINARY: 'cloudinary',
  SMTP: 'smtp',
  WEBHOOK: 'webhook',
  REST_API: 'rest_api',
  BIOMETRIC: 'biometric',
  WHATSAPP: 'whatsapp',
  SMS: 'sms',
  PAYMENT: 'payment',
  CALENDAR: 'calendar',
} as const;

export const WEBHOOK_EVENT = {
  EMPLOYEE_CREATED: 'EmployeeCreated',
  CANDIDATE_CONVERTED: 'CandidateConverted',
  PROJECT_CREATED: 'ProjectCreated',
  TASK_COMPLETED: 'TaskCompleted',
  ATTENDANCE_PROCESSED: 'AttendanceProcessed',
  PAYROLL_COMPLETED: 'PayrollCompleted',
  LEAD_WON: 'LeadWon',
  LEAVE_APPROVED: 'LeaveApproved',
} as const;

export const IMPORT_MODULE = {
  ORGANIZATION: 'organization',
  EMPLOYEE: 'employee',
  SALES_LEAD: 'sales_lead',
  RECRUITMENT: 'recruitment',
} as const;

export const IMPORT_FORMAT = {
  CSV: 'csv',
} as const;

export const EXPORT_FORMAT = {
  CSV: 'csv',
  PDF: 'pdf',
  XLSX: 'xlsx',
} as const;

export const JOB_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export const WEBHOOK_DELIVERY_STATUS = {
  PENDING: 'pending',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  RETRYING: 'retrying',
} as const;

export const INTEGRATION_LOG_CATEGORY = {
  API: 'api',
  WEBHOOK: 'webhook',
  IMPORT: 'import',
  EXPORT: 'export',
  SCHEDULER: 'scheduler',
  EMAIL: 'email',
  CLOUDINARY: 'cloudinary',
  ERROR: 'error',
} as const;

export const CONNECTOR_HEALTH_STATUS = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  UNHEALTHY: 'unhealthy',
  UNKNOWN: 'unknown',
} as const;

export const BACKUP_TYPE = {
  SETTINGS: 'settings',
  FULL: 'full',
} as const;

export const BACKUP_VERIFICATION_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  FAILED: 'failed',
} as const;

export const SCHEDULED_JOB_TYPE = {
  IMPORT: 'import',
  EXPORT: 'export',
  WEBHOOK_RETRY: 'webhook_retry',
  BACKUP: 'backup',
  CUSTOM: 'custom',
} as const;

export interface IntegrationConnectorDocument extends BaseDocument {
  type: string;
  name: string;
  config: Record<string, unknown>;
  status: string;
  enabled: boolean;
  lastSyncAt?: Date;
  lastError?: string;
  healthStatus: string;
}

export interface ApiKeyDocument extends BaseDocument {
  name: string;
  keyHash: string;
  keyPrefix: string;
  permissions: string[];
  rateLimit: number;
  expiresAt?: Date;
  lastUsedAt?: Date;
  isRevoked: boolean;
  allowedIps: string[];
}

export interface WebhookSubscriptionDocument extends BaseDocument {
  url: string;
  secret: string;
  events: string[];
  enabled: boolean;
  retryPolicy: {
    maxAttempts: number;
    backoffMs: number;
  };
}

export interface WebhookDeliveryDocument extends BaseDocument {
  subscriptionId: string;
  event: string;
  payload: Record<string, unknown>;
  status: string;
  attempts: number;
  responseCode?: number;
  error?: string;
}

export interface ImportJobDocument extends BaseDocument {
  module: string;
  format: string;
  status: string;
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: string[];
  previewData: Record<string, unknown>[];
  fileName?: string;
}

export interface ExportJobDocument extends BaseDocument {
  module: string;
  format: string;
  status: string;
  filters: Record<string, unknown>;
  columns: string[];
  downloadUrl?: string;
}

export interface ScheduledJobDocument extends BaseDocument {
  name: string;
  cronExpression: string;
  jobType: string;
  enabled: boolean;
  lastRunAt?: Date;
  nextRunAt?: Date;
  lastStatus?: string;
  config?: Record<string, unknown>;
}

export interface IntegrationLogDocument extends BaseDocument {
  category: string;
  message: string;
  metadata: Record<string, unknown>;
  correlationId?: string;
}

export interface BackupRecordDocument extends BaseDocument {
  type: string;
  status: string;
  sizeBytes: number;
  verificationStatus: string;
  fileName?: string;
  backupMeta?: Record<string, unknown>;
}

const integrationConnectorFields: SchemaDefinition = {
  type: { type: String, enum: Object.values(INTEGRATION_TYPE), required: true, index: true },
  name: { type: String, required: true, trim: true },
  config: { type: Schema.Types.Mixed, default: {} },
  status: { type: String, enum: Object.values(ENTITY_STATUS), default: ENTITY_STATUS.ACTIVE },
  enabled: { type: Boolean, default: true, index: true },
  lastSyncAt: { type: Date },
  lastError: { type: String, trim: true },
  healthStatus: { type: String, enum: Object.values(CONNECTOR_HEALTH_STATUS), default: CONNECTOR_HEALTH_STATUS.UNKNOWN },
};

const apiKeyFields: SchemaDefinition = {
  name: { type: String, required: true, trim: true },
  keyHash: { type: String, required: true, index: true },
  keyPrefix: { type: String, required: true, trim: true, index: true },
  permissions: { type: [String], default: [] },
  rateLimit: { type: Number, default: 1000, min: 1 },
  expiresAt: { type: Date, index: true },
  lastUsedAt: { type: Date },
  isRevoked: { type: Boolean, default: false, index: true },
  allowedIps: { type: [String], default: [] },
};

const webhookSubscriptionFields: SchemaDefinition = {
  url: { type: String, required: true, trim: true },
  secret: { type: String, required: true },
  events: { type: [String], default: [] },
  enabled: { type: Boolean, default: true, index: true },
  retryPolicy: {
    maxAttempts: { type: Number, default: 3, min: 1 },
    backoffMs: { type: Number, default: 5000, min: 100 },
  },
};

const webhookDeliveryFields: SchemaDefinition = {
  subscriptionId: { type: String, required: true, index: true },
  event: { type: String, required: true, index: true },
  payload: { type: Schema.Types.Mixed, default: {} },
  status: { type: String, enum: Object.values(WEBHOOK_DELIVERY_STATUS), default: WEBHOOK_DELIVERY_STATUS.PENDING },
  attempts: { type: Number, default: 0, min: 0 },
  responseCode: { type: Number },
  error: { type: String, trim: true },
};

const importJobFields: SchemaDefinition = {
  module: { type: String, enum: Object.values(IMPORT_MODULE), required: true, index: true },
  format: { type: String, enum: Object.values(IMPORT_FORMAT), default: IMPORT_FORMAT.CSV },
  status: { type: String, enum: Object.values(JOB_STATUS), default: JOB_STATUS.PENDING, index: true },
  totalRows: { type: Number, default: 0, min: 0 },
  successCount: { type: Number, default: 0, min: 0 },
  errorCount: { type: Number, default: 0, min: 0 },
  errors: { type: [String], default: [] },
  previewData: { type: [Schema.Types.Mixed], default: [] },
  fileName: { type: String, trim: true },
};

const exportJobFields: SchemaDefinition = {
  module: { type: String, required: true, index: true },
  format: { type: String, enum: Object.values(EXPORT_FORMAT), required: true },
  status: { type: String, enum: Object.values(JOB_STATUS), default: JOB_STATUS.PENDING, index: true },
  filters: { type: Schema.Types.Mixed, default: {} },
  columns: { type: [String], default: [] },
  downloadUrl: { type: String, trim: true },
};

const scheduledJobFields: SchemaDefinition = {
  name: { type: String, required: true, trim: true },
  cronExpression: { type: String, required: true, trim: true },
  jobType: { type: String, enum: Object.values(SCHEDULED_JOB_TYPE), required: true, index: true },
  enabled: { type: Boolean, default: true, index: true },
  lastRunAt: { type: Date },
  nextRunAt: { type: Date, index: true },
  lastStatus: { type: String, trim: true },
  config: { type: Schema.Types.Mixed, default: {} },
};

const integrationLogFields: SchemaDefinition = {
  category: { type: String, enum: Object.values(INTEGRATION_LOG_CATEGORY), required: true, index: true },
  message: { type: String, required: true, trim: true },
  metadata: { type: Schema.Types.Mixed, default: {} },
  correlationId: { type: String, trim: true, index: true },
};

const backupRecordFields: SchemaDefinition = {
  type: { type: String, enum: Object.values(BACKUP_TYPE), required: true, index: true },
  status: { type: String, enum: Object.values(JOB_STATUS), default: JOB_STATUS.PENDING, index: true },
  sizeBytes: { type: Number, default: 0, min: 0 },
  verificationStatus: { type: String, enum: Object.values(BACKUP_VERIFICATION_STATUS), default: BACKUP_VERIFICATION_STATUS.PENDING },
  fileName: { type: String, trim: true },
  backupMeta: { type: Schema.Types.Mixed, default: {} },
};

export const integrationConnectorModel = defineDomainModel<IntegrationConnectorDocument>(
  'IntegrationConnector',
  COLLECTIONS.INTEGRATION_CONNECTORS,
  integrationConnectorFields,
  {
    searchFields: ['name'],
    indexes: [
      { fields: { companyId: 1, type: 1, enabled: 1 }, options: { name: 'idx_connectors_company_type_enabled' } },
    ],
  },
);

export const apiKeyModel = defineDomainModel<ApiKeyDocument>(
  'ApiKey',
  COLLECTIONS.API_KEYS,
  apiKeyFields,
  {
    searchFields: ['name', 'keyPrefix'],
    indexes: [
      { fields: { companyId: 1, keyHash: 1 }, options: { unique: true, name: 'uq_api_keys_company_hash' } },
      { fields: { companyId: 1, isRevoked: 1 }, options: { name: 'idx_api_keys_company_revoked' } },
    ],
  },
);

export const webhookSubscriptionModel = defineDomainModel<WebhookSubscriptionDocument>(
  'WebhookSubscription',
  COLLECTIONS.WEBHOOK_SUBSCRIPTIONS,
  webhookSubscriptionFields,
  {
    indexes: [
      { fields: { companyId: 1, enabled: 1 }, options: { name: 'idx_webhook_subs_company_enabled' } },
    ],
  },
);

export const webhookDeliveryModel = defineDomainModel<WebhookDeliveryDocument>(
  'WebhookDelivery',
  COLLECTIONS.WEBHOOK_DELIVERIES,
  webhookDeliveryFields,
  {
    indexes: [
      { fields: { companyId: 1, subscriptionId: 1, createdAt: -1 }, options: { name: 'idx_webhook_deliveries_sub_date' } },
      { fields: { companyId: 1, status: 1 }, options: { name: 'idx_webhook_deliveries_company_status' } },
    ],
  },
);

export const importJobModel = defineDomainModel<ImportJobDocument>(
  'ImportJob',
  COLLECTIONS.IMPORT_JOBS,
  importJobFields,
  {
    indexes: [
      { fields: { companyId: 1, module: 1, createdAt: -1 }, options: { name: 'idx_import_jobs_company_module_date' } },
    ],
  },
);

export const exportJobModel = defineDomainModel<ExportJobDocument>(
  'ExportJob',
  COLLECTIONS.EXPORT_JOBS,
  exportJobFields,
  {
    indexes: [
      { fields: { companyId: 1, module: 1, createdAt: -1 }, options: { name: 'idx_export_jobs_company_module_date' } },
    ],
  },
);

export const scheduledJobModel = defineDomainModel<ScheduledJobDocument>(
  'ScheduledJob',
  COLLECTIONS.SCHEDULED_JOBS,
  scheduledJobFields,
  {
    searchFields: ['name'],
    indexes: [
      { fields: { companyId: 1, enabled: 1, nextRunAt: 1 }, options: { name: 'idx_scheduled_jobs_company_enabled_next' } },
    ],
  },
);

export const integrationLogModel = defineDomainModel<IntegrationLogDocument>(
  'IntegrationLog',
  COLLECTIONS.INTEGRATION_LOGS,
  integrationLogFields,
  {
    searchFields: ['message'],
    indexes: [
      { fields: { companyId: 1, category: 1, createdAt: -1 }, options: { name: 'idx_integration_logs_company_category_date' } },
      { fields: { companyId: 1, correlationId: 1 }, options: { name: 'idx_integration_logs_company_correlation', sparse: true } },
    ],
  },
);

export const backupRecordModel = defineDomainModel<BackupRecordDocument>(
  'BackupRecord',
  COLLECTIONS.BACKUP_RECORDS,
  backupRecordFields,
  {
    indexes: [
      { fields: { companyId: 1, type: 1, createdAt: -1 }, options: { name: 'idx_backup_records_company_type_date' } },
    ],
  },
);

export const IntegrationConnectorModel = integrationConnectorModel.model;
export const ApiKeyModel = apiKeyModel.model;
export const WebhookSubscriptionModel = webhookSubscriptionModel.model;
export const WebhookDeliveryModel = webhookDeliveryModel.model;
export const ImportJobModel = importJobModel.model;
export const ExportJobModel = exportJobModel.model;
export const ScheduledJobModel = scheduledJobModel.model;
export const IntegrationLogModel = integrationLogModel.model;
export const BackupRecordModel = backupRecordModel.model;

export const IntegrationConnectorRepository = integrationConnectorModel.repository;
export const ApiKeyRepository = apiKeyModel.repository;
export const WebhookSubscriptionRepository = webhookSubscriptionModel.repository;
export const WebhookDeliveryRepository = webhookDeliveryModel.repository;
export const ImportJobRepository = importJobModel.repository;
export const ExportJobRepository = exportJobModel.repository;
export const ScheduledJobRepository = scheduledJobModel.repository;
export const IntegrationLogRepository = integrationLogModel.repository;
export const BackupRecordRepository = backupRecordModel.repository;
