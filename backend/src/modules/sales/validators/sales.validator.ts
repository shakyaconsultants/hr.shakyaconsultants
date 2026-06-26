import { z } from 'zod';
import {
  LEAD_PRIORITY,
  LEAD_ASSIGNMENT_TYPE,
  LEAD_ACTIVITY_TYPE,
  CALL_DIRECTION,
  FOLLOW_UP_STATUS,
  DEAL_STATUS,
  SALES_TARGET_STATUS,
} from '@domain/sales/sales.schemas.js';
import { SALES_STATUS, ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { SALES_REPORT_TYPE } from '@modules/sales/constants/sales.constants.js';

export const idParamSchema = z.object({ id: z.uuid() });

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  status: z.string().optional(),
  search: z.string().optional(),
});

export const dashboardQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const analyticsQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  teamId: z.uuid().optional(),
  employeeId: z.uuid().optional(),
});

export const updatePoliciesSchema = z.object({
  assignmentRules: z.object({
    autoAssignEnabled: z.boolean().optional(),
    roundRobin: z.boolean().optional(),
    territoryBased: z.boolean().optional(),
    defaultTeamId: z.uuid().nullable().optional(),
  }).optional(),
  scoringRules: z.object({
    rules: z.array(z.object({
      field: z.string(),
      operator: z.string(),
      value: z.unknown(),
      points: z.number(),
    })).optional(),
    maxScore: z.number().optional(),
  }).optional(),
  policies: z.object({
    requireLostReason: z.boolean().optional(),
    requireWonReason: z.boolean().optional(),
    defaultCurrency: z.string().optional(),
    defaultPipelineName: z.string().optional(),
  }).optional(),
});

export const createLeadSourceSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
});

export const updateLeadSourceSchema = createLeadSourceSchema.partial().extend({
  status: z.enum(Object.values(ENTITY_STATUS) as [string, ...string[]]).optional(),
});

export const createPipelineSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  stages: z.array(z.object({
    id: z.string(),
    name: z.string(),
    order: z.number(),
    probability: z.number().min(0).max(100).optional(),
  })).optional(),
  isDefault: z.boolean().optional(),
});

export const updatePipelineSchema = createPipelineSchema.partial().extend({
  status: z.enum(Object.values(ENTITY_STATUS) as [string, ...string[]]).optional(),
});

export const createSalesTeamSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  managerEmployeeId: z.uuid(),
  memberEmployeeIds: z.array(z.uuid()).optional(),
  territoryId: z.uuid().optional(),
});

export const updateSalesTeamSchema = createSalesTeamSchema.partial().extend({
  status: z.enum(Object.values(ENTITY_STATUS) as [string, ...string[]]).optional(),
});

export const createTerritorySchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  branchId: z.uuid().optional(),
  region: z.string().optional(),
  assignedEmployeeIds: z.array(z.uuid()).optional(),
});

export const updateTerritorySchema = createTerritorySchema.partial().extend({
  status: z.enum(Object.values(ENTITY_STATUS) as [string, ...string[]]).optional(),
});

export const createSalesTargetSchema = z.object({
  employeeId: z.uuid().optional(),
  teamId: z.uuid().optional(),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  targetValue: z.number().min(0),
  currency: z.string().optional(),
});

export const updateSalesTargetSchema = z.object({
  targetValue: z.number().min(0).optional(),
  achievedValue: z.number().min(0).optional(),
  status: z.enum(Object.values(SALES_TARGET_STATUS) as [string, ...string[]]).optional(),
  periodStart: z.coerce.date().optional(),
  periodEnd: z.coerce.date().optional(),
});

export const createLeadSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  company: z.string().optional(),
  phone: z.string().optional(),
  source: z.string().optional(),
  sourceId: z.uuid().optional(),
  estimatedValue: z.number().min(0).optional(),
  dealValue: z.number().min(0).optional(),
  currency: z.string().optional(),
  assignedToId: z.uuid().optional(),
  pipelineId: z.uuid().optional(),
  stageId: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  priority: z.enum(Object.values(LEAD_PRIORITY) as [string, ...string[]]).optional(),
  territoryId: z.uuid().optional(),
  teamId: z.uuid().optional(),
  expectedCloseDate: z.coerce.date().optional(),
  internalNotes: z.string().optional(),
});

export const updateLeadSchema = createLeadSchema.partial().extend({
  status: z.enum(Object.values(SALES_STATUS) as [string, ...string[]]).optional(),
  lostReason: z.string().optional(),
  wonReason: z.string().optional(),
  attachmentUrls: z.array(z.string()).optional(),
});

export const listLeadsQuerySchema = listQuerySchema.extend({
  assignedToId: z.uuid().optional(),
  pipelineId: z.uuid().optional(),
  stageId: z.string().optional(),
  teamId: z.uuid().optional(),
  territoryId: z.uuid().optional(),
  priority: z.enum(Object.values(LEAD_PRIORITY) as [string, ...string[]]).optional(),
  sourceId: z.uuid().optional(),
});

export const assignLeadSchema = z.object({
  assignedToId: z.uuid(),
  assignmentType: z.enum(Object.values(LEAD_ASSIGNMENT_TYPE) as [string, ...string[]]).optional(),
  reason: z.string().optional(),
  teamId: z.uuid().optional(),
  territoryId: z.uuid().optional(),
});

export const moveStageSchema = z.object({
  stageId: z.string().min(1),
  pipelineId: z.uuid().optional(),
  wonReason: z.string().optional(),
  lostReason: z.string().optional(),
});

export const importLeadsSchema = z.object({
  csv: z.string().min(1),
});

export const createActivitySchema = z.object({
  leadId: z.uuid(),
  type: z.enum(Object.values(LEAD_ACTIVITY_TYPE) as [string, ...string[]]),
  description: z.string().min(1),
  title: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  attachmentUrls: z.array(z.string()).optional(),
  fromStageId: z.string().optional(),
  toStageId: z.string().optional(),
});

export const updateActivitySchema = z.object({
  description: z.string().optional(),
  title: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  attachmentUrls: z.array(z.string()).optional(),
});

export const listActivitiesQuerySchema = listQuerySchema.extend({
  leadId: z.uuid().optional(),
  type: z.enum(Object.values(LEAD_ACTIVITY_TYPE) as [string, ...string[]]).optional(),
});

export const createCallLogSchema = z.object({
  leadId: z.uuid().optional(),
  dealId: z.uuid().optional(),
  direction: z.enum(Object.values(CALL_DIRECTION) as [string, ...string[]]),
  durationSeconds: z.number().min(0),
  outcome: z.string().optional(),
  notes: z.string().optional(),
  calledAt: z.coerce.date().optional(),
});

export const updateCallLogSchema = z.object({
  outcome: z.string().optional(),
  notes: z.string().optional(),
  durationSeconds: z.number().min(0).optional(),
});

export const listCallLogsQuerySchema = listQuerySchema.extend({
  leadId: z.uuid().optional(),
  dealId: z.uuid().optional(),
  employeeId: z.uuid().optional(),
});

export const createFollowUpSchema = z.object({
  leadId: z.uuid().optional(),
  dealId: z.uuid().optional(),
  assignedToId: z.uuid(),
  scheduledAt: z.coerce.date(),
  notes: z.string().optional(),
});

export const updateFollowUpSchema = z.object({
  scheduledAt: z.coerce.date().optional(),
  notes: z.string().optional(),
  status: z.enum(Object.values(FOLLOW_UP_STATUS) as [string, ...string[]]).optional(),
  completedAt: z.coerce.date().optional(),
});

export const listFollowUpsQuerySchema = listQuerySchema.extend({
  leadId: z.uuid().optional(),
  dealId: z.uuid().optional(),
  assignedToId: z.uuid().optional(),
});

export const createDealSchema = z.object({
  leadId: z.uuid().optional(),
  name: z.string().min(1),
  value: z.number().min(0),
  currency: z.string().optional(),
  expectedCloseDate: z.coerce.date().optional(),
  ownerId: z.uuid().optional(),
  pipelineId: z.uuid().optional(),
  stageId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  priority: z.enum(Object.values(LEAD_PRIORITY) as [string, ...string[]]).optional(),
  teamId: z.uuid().optional(),
});

export const updateDealSchema = createDealSchema.partial().extend({
  status: z.enum(Object.values(DEAL_STATUS) as [string, ...string[]]).optional(),
  wonReason: z.string().optional(),
  lostReason: z.string().optional(),
});

export const listDealsQuerySchema = listQuerySchema.extend({
  ownerId: z.uuid().optional(),
  teamId: z.uuid().optional(),
  pipelineId: z.uuid().optional(),
});

export const reportQuerySchema = z.object({
  type: z.enum(Object.values(SALES_REPORT_TYPE) as [string, ...string[]]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  employeeId: z.uuid().optional(),
  teamId: z.uuid().optional(),
  sourceId: z.uuid().optional(),
  pipelineId: z.uuid().optional(),
  format: z.enum(['csv', 'html']).optional(),
});

export const listSalesTeamsQuerySchema = listQuerySchema.extend({
  managerEmployeeId: z.uuid().optional(),
});

export const listTerritoriesQuerySchema = listQuerySchema.extend({
  branchId: z.uuid().optional(),
});

export const listSalesTargetsQuerySchema = listQuerySchema.extend({
  employeeId: z.uuid().optional(),
  teamId: z.uuid().optional(),
});
