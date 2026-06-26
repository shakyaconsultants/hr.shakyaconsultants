import { z } from 'zod';
import { AUDIT_ACTION } from '@domain/audit/audit.schemas.js';
import { SETTING_GROUP, SETTING_VALUE_TYPE } from '@domain/master-data/master-data.schemas.js';

export const settingKeyParamSchema = z.object({
  key: z.string().min(1),
});

export const settingGroupParamSchema = z.object({
  group: z.enum(Object.values(SETTING_GROUP) as [string, ...string[]]),
});

export const featureFlagKeyParamSchema = z.object({
  flagKey: z.string().min(1),
});

export const auditIdParamSchema = z.object({
  id: z.string().min(1),
});

export const listSettingsQuerySchema = z.object({
  group: z.enum(Object.values(SETTING_GROUP) as [string, ...string[]]).optional(),
  isPublic: z.coerce.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export const settingHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export const auditExplorerQuerySchema = z.object({
  entityType: z.string().optional(),
  userId: z.string().optional(),
  action: z.enum(Object.values(AUDIT_ACTION) as [string, ...string[]]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export const createSettingSchema = z.object({
  key: z.string().min(1).max(120),
  name: z.string().max(120).optional(),
  category: z.string().max(60).optional(),
  value: z.unknown(),
  valueType: z.enum(Object.values(SETTING_VALUE_TYPE) as [string, ...string[]]).default(SETTING_VALUE_TYPE.STRING),
  defaultValue: z.unknown().optional(),
  group: z.enum(Object.values(SETTING_GROUP) as [string, ...string[]]),
  description: z.string().optional(),
  isEditable: z.boolean().default(true),
  isPublic: z.boolean().default(false),
  validation: z.record(z.string(), z.unknown()).optional(),
  encrypted: z.boolean().default(false),
});

export const updateSettingSchema = createSettingSchema.partial().omit({ key: true }).extend({
  changeReason: z.string().max(500).optional(),
});

export const toggleFeatureFlagSchema = z.object({
  enabled: z.boolean(),
});

export const navigationOverrideSchema = z.object({
  id: z.string().min(1),
  enabled: z.boolean(),
  sortOrder: z.number().int().min(0),
  groupId: z.string().min(1),
  icon: z.string().optional(),
  portals: z.array(z.string()).optional(),
  permission: z.string().optional(),
});

export const updateNavigationSchema = z.object({
  overrides: z.array(navigationOverrideSchema),
});

export const emailTestSchema = z.object({
  to: z.string().email().optional(),
});

export type CreateSettingInput = z.infer<typeof createSettingSchema>;
export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;
export type AuditExplorerQueryInput = z.infer<typeof auditExplorerQuerySchema>;
export type NavigationOverrideInput = z.infer<typeof navigationOverrideSchema>;
