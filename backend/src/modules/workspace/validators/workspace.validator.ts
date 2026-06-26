import { z } from 'zod';
import { WORKSPACE_WIDGET } from '@domain/workspace/workspace-extended.schemas.js';
import { PROJECT_TASK_STATUS } from '@domain/project/project-extended.schemas.js';

export const idParamSchema = z.object({ id: z.uuid() });
export const slugParamSchema = z.object({ slug: z.string().min(1) });

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const myTasksQuerySchema = listQuerySchema.extend({
  status: z.string().optional(),
  projectId: z.uuid().optional(),
  view: z.enum(['kanban', 'list', 'calendar']).optional(),
});

export const notificationQuerySchema = listQuerySchema.extend({
  isRead: z.coerce.boolean().optional(),
  isArchived: z.coerce.boolean().optional(),
  category: z.string().optional(),
});

export const calendarQuerySchema = z.object({
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  types: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const widgetConfigSchema = z.object({
  widgets: z.array(z.object({
    widgetSlug: z.enum(Object.values(WORKSPACE_WIDGET) as [string, ...string[]]),
    sortOrder: z.number().int().min(0),
    isVisible: z.boolean(),
    columnSpan: z.number().int().min(1).max(2).optional(),
    config: z.record(z.string(), z.unknown()).optional(),
  })).min(1),
});

export const profileUpdateSchema = z.object({
  phone: z.string().optional(),
  personalEmail: z.email().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  bio: z.string().max(2000).optional(),
});

export const bulkTaskStatusSchema = z.object({
  taskIds: z.array(z.uuid()).min(1),
  status: z.enum(Object.values(PROJECT_TASK_STATUS) as [string, ...string[]]),
});

export const quickTaskUpdateSchema = z.object({
  status: z.enum(Object.values(PROJECT_TASK_STATUS) as [string, ...string[]]).optional(),
  progressPercent: z.number().min(0).max(100).optional(),
});

export type WidgetConfigBody = z.infer<typeof widgetConfigSchema>;
export type ProfileUpdateBody = z.infer<typeof profileUpdateSchema>;
