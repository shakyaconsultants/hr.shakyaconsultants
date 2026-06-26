import { Schema, type SchemaDefinition } from 'mongoose';
import { defineDomainModel } from '@infrastructure/database/model.factory.js';
import { COLLECTIONS } from '@infrastructure/database/constants/collections.js';
import type { BaseDocument } from '@infrastructure/database/types/base-document.types.js';

export const AUDIT_ACTION = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  READ: 'read',
  LOGIN: 'login',
  LOGOUT: 'logout',
  EXPORT: 'export',
  IMPORT: 'import',
} as const;

export interface AuditLogDocument extends BaseDocument {
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  changes: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface ActivityLogDocument extends BaseDocument {
  userId: string;
  activityType: string;
  description: string;
  entityType?: string;
  entityId?: string;
  activityMeta: Record<string, unknown>;
}

export interface LoginHistoryDocument extends BaseDocument {
  userId: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  failureReason?: string;
  correlationId?: string;
  loggedInAt: Date;
}

export interface DeviceSessionDocument extends BaseDocument {
  userId: string;
  sessionId: string;
  deviceId: string;
  deviceName?: string;
  browser?: string;
  os?: string;
  platform?: string;
  ipAddress: string;
  userAgent: string;
  refreshTokenHash: string;
  loggedInAt: Date;
  lastActiveAt: Date;
  expiresAt: Date;
  rememberMe: boolean;
  isActive: boolean;
  revoked: boolean;
  revokedAt: Date | null;
  location?: {
    city?: string;
    region?: string;
    country?: string;
  };
}

export interface ApiLogDocument extends BaseDocument {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  userId?: string;
  ipAddress: string;
  requestId: string;
  errorMessage?: string;
}

const auditLogFields: SchemaDefinition = {
  action: { type: String, enum: Object.values(AUDIT_ACTION), required: true, index: true },
  entityType: { type: String, required: true, trim: true, index: true },
  entityId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  changes: { type: Schema.Types.Mixed, default: {} },
  ipAddress: { type: String, trim: true },
  userAgent: { type: String, trim: true },
};

const activityLogFields: SchemaDefinition = {
  userId: { type: String, required: true, index: true },
  activityType: { type: String, required: true, trim: true, index: true },
  description: { type: String, required: true, trim: true },
  entityType: { type: String, trim: true, index: true },
  entityId: { type: String, index: true },
  activityMeta: { type: Schema.Types.Mixed, default: {} },
};

const loginHistoryFields: SchemaDefinition = {
  userId: { type: String, required: true, index: true },
  ipAddress: { type: String, required: true, trim: true },
  userAgent: { type: String, required: true, trim: true },
  success: { type: Boolean, required: true, index: true },
  failureReason: { type: String, trim: true },
  correlationId: { type: String, trim: true, index: true },
  loggedInAt: { type: Date, required: true, default: Date.now, index: true },
};

const deviceSessionFields: SchemaDefinition = {
  userId: { type: String, required: true, index: true },
  sessionId: { type: String, required: true, trim: true, index: true },
  deviceId: { type: String, required: true, trim: true },
  deviceName: { type: String, trim: true },
  browser: { type: String, trim: true },
  os: { type: String, trim: true },
  platform: { type: String, trim: true },
  ipAddress: { type: String, required: true, trim: true },
  userAgent: { type: String, required: true, trim: true },
  refreshTokenHash: { type: String, required: true, select: false },
  loggedInAt: { type: Date, required: true, default: Date.now },
  lastActiveAt: { type: Date, required: true, default: Date.now },
  expiresAt: { type: Date, required: true, index: true },
  rememberMe: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true, index: true },
  revoked: { type: Boolean, default: false, index: true },
  revokedAt: { type: Date, default: null },
  location: {
    city: { type: String },
    region: { type: String },
    country: { type: String },
  },
};

const apiLogFields: SchemaDefinition = {
  method: { type: String, required: true, trim: true, uppercase: true },
  path: { type: String, required: true, trim: true },
  statusCode: { type: Number, required: true, index: true },
  durationMs: { type: Number, required: true, min: 0 },
  userId: { type: String, index: true },
  ipAddress: { type: String, required: true, trim: true },
  requestId: { type: String, required: true, index: true },
  errorMessage: { type: String, trim: true },
};

const auditModelOptions = {
  withSoftDelete: false,
  withVersioning: false,
} as const;

export const auditLogModel = defineDomainModel<AuditLogDocument>(
  'AuditLog',
  COLLECTIONS.AUDIT_LOGS,
  auditLogFields,
  {
    ...auditModelOptions,
    indexes: [
      { fields: { companyId: 1, entityType: 1, entityId: 1, createdAt: -1 }, options: { name: 'idx_audit_logs_company_entity_date' } },
      { fields: { companyId: 1, userId: 1, createdAt: -1 }, options: { name: 'idx_audit_logs_company_user_date' } },
      { fields: { companyId: 1, action: 1, createdAt: -1 }, options: { name: 'idx_audit_logs_company_action_date' } },
    ],
  },
);

export const activityLogModel = defineDomainModel<ActivityLogDocument>(
  'ActivityLog',
  COLLECTIONS.ACTIVITY_LOGS,
  activityLogFields,
  {
    ...auditModelOptions,
    indexes: [
      { fields: { companyId: 1, userId: 1, createdAt: -1 }, options: { name: 'idx_activity_logs_company_user_date' } },
      { fields: { companyId: 1, activityType: 1, createdAt: -1 }, options: { name: 'idx_activity_logs_company_type_date' } },
    ],
  },
);

export const loginHistoryModel = defineDomainModel<LoginHistoryDocument>(
  'LoginHistory',
  COLLECTIONS.LOGIN_HISTORIES,
  loginHistoryFields,
  {
    ...auditModelOptions,
    indexes: [
      { fields: { companyId: 1, userId: 1, loggedInAt: -1 }, options: { name: 'idx_login_histories_company_user_date' } },
      { fields: { companyId: 1, success: 1, loggedInAt: -1 }, options: { name: 'idx_login_histories_company_success_date' } },
    ],
  },
);

export const deviceSessionModel = defineDomainModel<DeviceSessionDocument>(
  'DeviceSession',
  COLLECTIONS.DEVICE_SESSIONS,
  deviceSessionFields,
  {
    ...auditModelOptions,
    indexes: [
      { fields: { companyId: 1, userId: 1, isActive: 1 }, options: { name: 'idx_device_sessions_company_user_active' } },
      { fields: { companyId: 1, sessionId: 1 }, options: { unique: true, name: 'uq_device_sessions_company_session' } },
      { fields: { expiresAt: 1 }, options: { name: 'idx_device_sessions_expires', expireAfterSeconds: 0 } },
    ],
  },
);

export const apiLogModel = defineDomainModel<ApiLogDocument>(
  'ApiLog',
  COLLECTIONS.API_LOGS,
  apiLogFields,
  {
    ...auditModelOptions,
    indexes: [
      { fields: { companyId: 1, createdAt: -1 }, options: { name: 'idx_api_logs_company_date' } },
      { fields: { companyId: 1, statusCode: 1, createdAt: -1 }, options: { name: 'idx_api_logs_company_status_date' } },
      { fields: { requestId: 1 }, options: { unique: true, name: 'uq_api_logs_request_id' } },
      { fields: { companyId: 1, path: 1, method: 1 }, options: { name: 'idx_api_logs_company_path_method' } },
    ],
  },
);

export const AuditLogModel = auditLogModel.model;
export const ActivityLogModel = activityLogModel.model;
export const LoginHistoryModel = loginHistoryModel.model;
export const DeviceSessionModel = deviceSessionModel.model;
export const ApiLogModel = apiLogModel.model;

export const AuditLogRepository = auditLogModel.repository;
export const ActivityLogRepository = activityLogModel.repository;
export const LoginHistoryRepository = loginHistoryModel.repository;
export const DeviceSessionRepository = deviceSessionModel.repository;
export const ApiLogRepository = apiLogModel.repository;
