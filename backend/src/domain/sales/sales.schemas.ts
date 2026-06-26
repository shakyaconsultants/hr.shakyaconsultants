import { type SchemaDefinition } from 'mongoose';
import { defineDomainModel } from '@infrastructure/database/model.factory.js';
import { COLLECTIONS } from '@infrastructure/database/constants/collections.js';
import type { BaseDocument } from '@infrastructure/database/types/base-document.types.js';
import { ENTITY_STATUS, SALES_STATUS } from '@shared/constants/status.constants.js';

export const LEAD_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export const LEAD_ASSIGNMENT_TYPE = {
  MANUAL: 'manual',
  AUTOMATIC: 'automatic',
  TERRITORY: 'territory',
  MANAGER_OVERRIDE: 'manager_override',
} as const;

export const LEAD_ACTIVITY_TYPE = {
  CALL: 'call',
  EMAIL: 'email',
  MEETING: 'meeting',
  NOTE: 'note',
  STATUS_CHANGE: 'status_change',
  ATTACHMENT: 'attachment',
  ASSIGNMENT: 'assignment',
  PIPELINE_MOVE: 'pipeline_move',
  WHATSAPP: 'whatsapp',
} as const;

export const CALL_DIRECTION = {
  INBOUND: 'inbound',
  OUTBOUND: 'outbound',
} as const;

export const FOLLOW_UP_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  OVERDUE: 'overdue',
} as const;

export const DEAL_STATUS = {
  OPEN: 'open',
  WON: 'won',
  LOST: 'lost',
  ON_HOLD: 'on_hold',
} as const;

export const SALES_TARGET_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export interface LeadDocument extends BaseDocument {
  firstName: string;
  lastName: string;
  company?: string;
  email: string;
  phone?: string;
  source?: string;
  status: string;
  estimatedValue?: number;
  currency?: string;
  assignedToId?: string;
  pipelineId?: string;
  stageId?: string;
  notes?: string;
  tags: string[];
  priority?: string;
  score?: number;
  lostReason?: string;
  wonReason?: string;
  expectedCloseDate?: Date;
  dealValue?: number;
  territoryId?: string;
  teamId?: string;
  sourceId?: string;
  attachmentUrls: string[];
  internalNotes?: string;
  lastActivityAt?: Date;
}

export interface LeadActivityDocument extends BaseDocument {
  leadId: string;
  type: string;
  description: string;
  performedBy: string;
  performedAt: Date;
  title?: string;
  metadata: Record<string, unknown>;
  attachmentUrls: string[];
  fromStageId?: string;
  toStageId?: string;
}

export interface LeadAssignmentDocument extends BaseDocument {
  leadId: string;
  assignedToId: string;
  assignedBy: string;
  assignedAt: Date;
  isActive: boolean;
  assignmentType: string;
  reason?: string;
  teamId?: string;
  territoryId?: string;
  unassignedAt?: Date;
}

export interface DealDocument extends BaseDocument {
  leadId?: string;
  name: string;
  value: number;
  currency: string;
  status: string;
  expectedCloseDate?: Date;
  ownerId: string;
  pipelineId?: string;
  stageId?: string;
  closedAt?: Date;
  lostReason?: string;
  wonReason?: string;
  tags: string[];
  priority?: string;
  teamId?: string;
}

export interface CallLogDocument extends BaseDocument {
  leadId?: string;
  dealId?: string;
  employeeId: string;
  direction: string;
  durationSeconds: number;
  outcome?: string;
  notes?: string;
  calledAt: Date;
}

export interface FollowUpDocument extends BaseDocument {
  leadId?: string;
  dealId?: string;
  assignedToId: string;
  scheduledAt: Date;
  completedAt?: Date;
  status: string;
  notes?: string;
}

export interface PipelineDocument extends BaseDocument {
  name: string;
  description?: string;
  stages: Array<{
    id: string;
    name: string;
    order: number;
    probability?: number;
  }>;
  isDefault: boolean;
  status: string;
}

export interface LeadSourceDocument extends BaseDocument {
  name: string;
  code: string;
  description?: string;
  status: string;
}

export interface SalesTeamDocument extends BaseDocument {
  name: string;
  code: string;
  managerEmployeeId: string;
  memberEmployeeIds: string[];
  territoryId?: string;
  status: string;
}

export interface TerritoryDocument extends BaseDocument {
  name: string;
  code: string;
  branchId?: string;
  region?: string;
  assignedEmployeeIds: string[];
  status: string;
}

export interface SalesTargetDocument extends BaseDocument {
  employeeId?: string;
  teamId?: string;
  periodStart: Date;
  periodEnd: Date;
  targetValue: number;
  achievedValue: number;
  currency: string;
  status: string;
}

const leadFields: SchemaDefinition = {
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  company: { type: String, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  source: { type: String, trim: true },
  status: { type: String, enum: Object.values(SALES_STATUS), default: SALES_STATUS.LEAD },
  estimatedValue: { type: Number, min: 0 },
  currency: { type: String, default: 'INR' },
  assignedToId: { type: String, index: true },
  pipelineId: { type: String, index: true },
  stageId: { type: String, index: true },
  notes: { type: String, trim: true },
  tags: { type: [String], default: [] },
  priority: { type: String, enum: Object.values(LEAD_PRIORITY) },
  score: { type: Number, min: 0, default: 0 },
  lostReason: { type: String, trim: true },
  wonReason: { type: String, trim: true },
  expectedCloseDate: { type: Date, index: true },
  dealValue: { type: Number, min: 0 },
  territoryId: { type: String, index: true },
  teamId: { type: String, index: true },
  sourceId: { type: String, index: true },
  attachmentUrls: { type: [String], default: [] },
  internalNotes: { type: String, trim: true },
  lastActivityAt: { type: Date, index: true },
};

const leadActivityFields: SchemaDefinition = {
  leadId: { type: String, required: true, index: true },
  type: { type: String, enum: Object.values(LEAD_ACTIVITY_TYPE), required: true },
  description: { type: String, required: true, trim: true },
  performedBy: { type: String, required: true, index: true },
  performedAt: { type: Date, required: true, default: Date.now, index: true },
  title: { type: String, trim: true },
  metadata: { type: Object, default: {} },
  attachmentUrls: { type: [String], default: [] },
  fromStageId: { type: String },
  toStageId: { type: String },
};

const leadAssignmentFields: SchemaDefinition = {
  leadId: { type: String, required: true, index: true },
  assignedToId: { type: String, required: true, index: true },
  assignedBy: { type: String, required: true },
  assignedAt: { type: Date, required: true, default: Date.now },
  isActive: { type: Boolean, default: true },
  assignmentType: { type: String, enum: Object.values(LEAD_ASSIGNMENT_TYPE), required: true },
  reason: { type: String, trim: true },
  teamId: { type: String, index: true },
  territoryId: { type: String, index: true },
  unassignedAt: { type: Date },
};

const dealFields: SchemaDefinition = {
  leadId: { type: String, index: true },
  name: { type: String, required: true, trim: true },
  value: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: Object.values(DEAL_STATUS), default: DEAL_STATUS.OPEN },
  expectedCloseDate: { type: Date, index: true },
  ownerId: { type: String, required: true, index: true },
  pipelineId: { type: String, index: true },
  stageId: { type: String, index: true },
  closedAt: { type: Date },
  lostReason: { type: String, trim: true },
  wonReason: { type: String, trim: true },
  tags: { type: [String], default: [] },
  priority: { type: String, enum: Object.values(LEAD_PRIORITY) },
  teamId: { type: String, index: true },
};

const callLogFields: SchemaDefinition = {
  leadId: { type: String, index: true },
  dealId: { type: String, index: true },
  employeeId: { type: String, required: true, index: true },
  direction: { type: String, enum: Object.values(CALL_DIRECTION), required: true },
  durationSeconds: { type: Number, required: true, min: 0 },
  outcome: { type: String, trim: true },
  notes: { type: String, trim: true },
  calledAt: { type: Date, required: true, default: Date.now, index: true },
};

const followUpFields: SchemaDefinition = {
  leadId: { type: String, index: true },
  dealId: { type: String, index: true },
  assignedToId: { type: String, required: true, index: true },
  scheduledAt: { type: Date, required: true, index: true },
  completedAt: { type: Date },
  status: { type: String, enum: Object.values(FOLLOW_UP_STATUS), default: FOLLOW_UP_STATUS.PENDING },
  notes: { type: String, trim: true },
};

const pipelineFields: SchemaDefinition = {
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  stages: {
    type: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        order: { type: Number, required: true },
        probability: { type: Number, min: 0, max: 100 },
      },
    ],
    default: [],
  },
  isDefault: { type: Boolean, default: false },
  status: { type: String, enum: Object.values(ENTITY_STATUS), default: ENTITY_STATUS.ACTIVE },
};

const leadSourceFields: SchemaDefinition = {
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  description: { type: String, trim: true },
  status: { type: String, enum: Object.values(ENTITY_STATUS), default: ENTITY_STATUS.ACTIVE },
};

const salesTeamFields: SchemaDefinition = {
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  managerEmployeeId: { type: String, required: true, index: true },
  memberEmployeeIds: { type: [String], default: [] },
  territoryId: { type: String, index: true },
  status: { type: String, enum: Object.values(ENTITY_STATUS), default: ENTITY_STATUS.ACTIVE },
};

const territoryFields: SchemaDefinition = {
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  branchId: { type: String, index: true },
  region: { type: String, trim: true },
  assignedEmployeeIds: { type: [String], default: [] },
  status: { type: String, enum: Object.values(ENTITY_STATUS), default: ENTITY_STATUS.ACTIVE },
};

const salesTargetFields: SchemaDefinition = {
  employeeId: { type: String, index: true },
  teamId: { type: String, index: true },
  periodStart: { type: Date, required: true, index: true },
  periodEnd: { type: Date, required: true, index: true },
  targetValue: { type: Number, required: true, min: 0 },
  achievedValue: { type: Number, default: 0, min: 0 },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: Object.values(SALES_TARGET_STATUS), default: SALES_TARGET_STATUS.ACTIVE },
};

export const leadModel = defineDomainModel<LeadDocument>(
  'Lead',
  COLLECTIONS.LEADS,
  leadFields,
  {
    searchFields: ['firstName', 'lastName', 'email', 'phone', 'company'],
    indexes: [
      { fields: { companyId: 1, email: 1 }, options: { name: 'idx_leads_company_email' } },
      { fields: { companyId: 1, status: 1 }, options: { name: 'idx_leads_company_status' } },
      { fields: { companyId: 1, assignedToId: 1, status: 1 }, options: { name: 'idx_leads_company_assignee_status' } },
      { fields: { companyId: 1, pipelineId: 1, stageId: 1 }, options: { name: 'idx_leads_company_pipeline_stage' } },
      { fields: { companyId: 1, teamId: 1 }, options: { name: 'idx_leads_company_team', sparse: true } },
      { fields: { companyId: 1, territoryId: 1 }, options: { name: 'idx_leads_company_territory', sparse: true } },
    ],
  },
);

export const leadActivityModel = defineDomainModel<LeadActivityDocument>(
  'LeadActivity',
  COLLECTIONS.LEAD_ACTIVITIES,
  leadActivityFields,
  {
    indexes: [
      { fields: { companyId: 1, leadId: 1, performedAt: -1 }, options: { name: 'idx_lead_activities_company_lead_date' } },
    ],
  },
);

export const leadAssignmentModel = defineDomainModel<LeadAssignmentDocument>(
  'LeadAssignment',
  COLLECTIONS.LEAD_ASSIGNMENTS,
  leadAssignmentFields,
  {
    indexes: [
      { fields: { companyId: 1, leadId: 1, isActive: 1 }, options: { name: 'idx_lead_assignments_company_lead_active' } },
      { fields: { companyId: 1, assignedToId: 1, isActive: 1 }, options: { name: 'idx_lead_assignments_company_assignee_active' } },
    ],
  },
);

export const dealModel = defineDomainModel<DealDocument>(
  'Deal',
  COLLECTIONS.DEALS,
  dealFields,
  {
    searchFields: ['name'],
    indexes: [
      { fields: { companyId: 1, ownerId: 1, status: 1 }, options: { name: 'idx_deals_company_owner_status' } },
      { fields: { companyId: 1, pipelineId: 1, stageId: 1 }, options: { name: 'idx_deals_company_pipeline_stage' } },
      { fields: { companyId: 1, expectedCloseDate: 1 }, options: { name: 'idx_deals_company_close_date', sparse: true } },
    ],
  },
);

export const callLogModel = defineDomainModel<CallLogDocument>(
  'CallLog',
  COLLECTIONS.CALL_LOGS,
  callLogFields,
  {
    indexes: [
      { fields: { companyId: 1, employeeId: 1, calledAt: -1 }, options: { name: 'idx_call_logs_company_employee_date' } },
      { fields: { companyId: 1, leadId: 1, calledAt: -1 }, options: { name: 'idx_call_logs_company_lead_date', sparse: true } },
    ],
  },
);

export const followUpModel = defineDomainModel<FollowUpDocument>(
  'FollowUp',
  COLLECTIONS.FOLLOW_UPS,
  followUpFields,
  {
    indexes: [
      { fields: { companyId: 1, assignedToId: 1, status: 1, scheduledAt: 1 }, options: { name: 'idx_follow_ups_company_assignee_status_date' } },
    ],
  },
);

export const pipelineModel = defineDomainModel<PipelineDocument>(
  'Pipeline',
  COLLECTIONS.PIPELINES,
  pipelineFields,
  {
    indexes: [
      { fields: { companyId: 1, name: 1 }, options: { unique: true, name: 'uq_pipelines_company_name' } },
      { fields: { companyId: 1, isDefault: 1 }, options: { name: 'idx_pipelines_company_default' } },
    ],
  },
);

export const leadSourceModel = defineDomainModel<LeadSourceDocument>(
  'LeadSource',
  COLLECTIONS.LEAD_SOURCES,
  leadSourceFields,
  {
    indexes: [
      { fields: { companyId: 1, code: 1 }, options: { unique: true, name: 'uq_lead_sources_company_code' } },
    ],
  },
);

export const salesTeamModel = defineDomainModel<SalesTeamDocument>(
  'SalesTeam',
  COLLECTIONS.SALES_TEAMS,
  salesTeamFields,
  {
    indexes: [
      { fields: { companyId: 1, code: 1 }, options: { unique: true, name: 'uq_sales_teams_company_code' } },
      { fields: { companyId: 1, managerEmployeeId: 1 }, options: { name: 'idx_sales_teams_company_manager' } },
    ],
  },
);

export const territoryModel = defineDomainModel<TerritoryDocument>(
  'Territory',
  COLLECTIONS.TERRITORIES,
  territoryFields,
  {
    indexes: [
      { fields: { companyId: 1, code: 1 }, options: { unique: true, name: 'uq_territories_company_code' } },
      { fields: { companyId: 1, branchId: 1 }, options: { name: 'idx_territories_company_branch', sparse: true } },
    ],
  },
);

export const salesTargetModel = defineDomainModel<SalesTargetDocument>(
  'SalesTarget',
  COLLECTIONS.SALES_TARGETS,
  salesTargetFields,
  {
    indexes: [
      { fields: { companyId: 1, employeeId: 1, periodStart: 1 }, options: { name: 'idx_sales_targets_company_employee_period', sparse: true } },
      { fields: { companyId: 1, teamId: 1, periodStart: 1 }, options: { name: 'idx_sales_targets_company_team_period', sparse: true } },
    ],
  },
);

export const LeadModel = leadModel.model;
export const LeadActivityModel = leadActivityModel.model;
export const LeadAssignmentModel = leadAssignmentModel.model;
export const DealModel = dealModel.model;
export const CallLogModel = callLogModel.model;
export const FollowUpModel = followUpModel.model;
export const PipelineModel = pipelineModel.model;
export const LeadSourceModel = leadSourceModel.model;
export const SalesTeamModel = salesTeamModel.model;
export const TerritoryModel = territoryModel.model;
export const SalesTargetModel = salesTargetModel.model;

export const LeadRepository = leadModel.repository;
export const LeadActivityRepository = leadActivityModel.repository;
export const LeadAssignmentRepository = leadAssignmentModel.repository;
export const DealRepository = dealModel.repository;
export const CallLogRepository = callLogModel.repository;
export const FollowUpRepository = followUpModel.repository;
export const PipelineRepository = pipelineModel.repository;
export const LeadSourceRepository = leadSourceModel.repository;
export const SalesTeamRepository = salesTeamModel.repository;
export const TerritoryRepository = territoryModel.repository;
export const SalesTargetRepository = salesTargetModel.repository;
