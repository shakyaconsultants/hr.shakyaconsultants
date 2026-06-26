import { z } from 'zod';
import {
  INTEGRATION_TYPE,
  WEBHOOK_EVENT,
  IMPORT_MODULE,
  IMPORT_FORMAT,
  EXPORT_FORMAT,
  SCHEDULED_JOB_TYPE,
  INTEGRATION_LOG_CATEGORY,
  BACKUP_TYPE,
} from '@domain/integration/integration.schemas.js';

export const idParamSchema = z.object({ id: z.uuid() });

export const moduleParamSchema = z.object({ module: z.string().min(1) });

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  type: z.string().optional(),
  enabled: z.coerce.boolean().optional(),
  module: z.string().optional(),
  category: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  correlationId: z.string().optional(),
});

export const createConnectorSchema = z.object({
  type: z.enum(Object.values(INTEGRATION_TYPE) as [string, ...string[]]),
  name: z.string().min(1).max(120),
  config: z.record(z.string(), z.unknown()).optional(),
  enabled: z.boolean().optional(),
});

export const updateConnectorSchema = createConnectorSchema.partial();

export const createApiKeySchema = z.object({
  name: z.string().min(1).max(120),
  permissions: z.array(z.string()).optional(),
  rateLimit: z.number().int().min(1).optional(),
  expiresAt: z.string().optional(),
  allowedIps: z.array(z.string()).optional(),
});

export const createWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum(Object.values(WEBHOOK_EVENT) as [string, ...string[]])).min(1),
  enabled: z.boolean().optional(),
  retryPolicy: z.object({
    maxAttempts: z.number().int().min(1).optional(),
    backoffMs: z.number().int().min(100).optional(),
  }).optional(),
});

export const updateWebhookSchema = createWebhookSchema.partial();

export const importPreviewSchema = z.object({
  module: z.enum(Object.values(IMPORT_MODULE) as [string, ...string[]]),
  content: z.string().min(1),
  fileName: z.string().optional(),
  entityKey: z.string().optional(),
  format: z.enum(Object.values(IMPORT_FORMAT) as [string, ...string[]]).optional(),
});

export const importExecuteSchema = importPreviewSchema;

export const exportSchema = z.object({
  module: z.string().min(1),
  format: z.enum(Object.values(EXPORT_FORMAT) as [string, ...string[]]),
  filters: z.record(z.string(), z.unknown()).optional(),
  columns: z.array(z.string()).optional(),
  entityKey: z.string().optional(),
});

export const createScheduledJobSchema = z.object({
  name: z.string().min(1).max(120),
  cronExpression: z.string().min(1),
  jobType: z.enum(Object.values(SCHEDULED_JOB_TYPE) as [string, ...string[]]),
  enabled: z.boolean().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export const updateScheduledJobSchema = createScheduledJobSchema.partial();

export const createBackupSchema = z.object({
  type: z.enum(Object.values(BACKUP_TYPE) as [string, ...string[]]).optional(),
});

export const logExportQuerySchema = listQuerySchema.extend({
  category: z.enum(Object.values(INTEGRATION_LOG_CATEGORY) as [string, ...string[]]).optional(),
});

export const importTemplateQuerySchema = z.object({
  entityKey: z.string().optional(),
});
