import { z } from 'zod';
import { APPROVER_TYPE } from '@domain/approval/approval.schemas.js';

export const idParamSchema = z.object({ id: z.uuid() });

export const approvalListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  status: z.string().optional(),
  requestType: z.string().optional(),
  entityType: z.string().optional(),
});

export const workflowStageSchema = z.object({
  order: z.number().int().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  approverType: z.enum(Object.values(APPROVER_TYPE) as [string, ...string[]]),
  approverRoleSlug: z.string().optional(),
  approverEmployeeId: z.uuid().optional(),
  hierarchyLevelSlug: z.string().optional(),
  slaHours: z.number().int().min(1).optional(),
  autoApproveAfterHours: z.number().int().min(1).optional(),
  allowSelfApproval: z.boolean().optional(),
  isRequired: z.boolean(),
});

export const createWorkflowSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  requestType: z.string().min(1),
  description: z.string().optional(),
  stages: z.array(workflowStageSchema).min(1),
  isDefault: z.boolean().optional(),
});

export const updateWorkflowSchema = createWorkflowSchema.partial();

export const decisionSchema = z.object({ comments: z.string().optional() });

export const bulkApproveSchema = z.object({
  requestIds: z.array(z.uuid()).min(1),
  comments: z.string().optional(),
});

export const commentSchema = z.object({ comments: z.string().min(1) });
