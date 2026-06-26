import { Schema, type SchemaDefinition } from 'mongoose';
import { defineDomainModel } from '@infrastructure/database/model.factory.js';
import { COLLECTIONS } from '@infrastructure/database/constants/collections.js';
import type { BaseDocument } from '@infrastructure/database/types/base-document.types.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';

export const APPROVAL_REQUEST_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  WITHDRAWN: 'withdrawn',
  ESCALATED: 'escalated',
} as const;

export const APPROVAL_ACTION_TYPE = {
  SUBMIT: 'submit',
  APPROVE: 'approve',
  REJECT: 'reject',
  DELEGATE: 'delegate',
  ESCALATE: 'escalate',
  COMMENT: 'comment',
  WITHDRAW: 'withdraw',
  CANCEL: 'cancel',
  AUTO_APPROVE: 'auto_approve',
} as const;

export const APPROVER_TYPE = {
  MANAGER: 'manager',
  ROLE: 'role',
  EMPLOYEE: 'employee',
  HIERARCHY_LEVEL: 'hierarchy_level',
} as const;

export interface ApprovalWorkflowStageDefinition {
  order: number;
  name: string;
  slug: string;
  approverType: string;
  approverRoleSlug?: string;
  approverEmployeeId?: string;
  hierarchyLevelSlug?: string;
  slaHours?: number;
  autoApproveAfterHours?: number;
  allowSelfApproval?: boolean;
  isRequired: boolean;
}

export interface ApprovalWorkflowDocument extends BaseDocument {
  name: string;
  slug: string;
  requestType: string;
  description?: string;
  stages: ApprovalWorkflowStageDefinition[];
  isDefault: boolean;
  status: string;
}

export interface ApprovalRequestDocument extends BaseDocument {
  requestType: string;
  entityType: string;
  entityId: string;
  workflowId: string;
  workflowSlug: string;
  requesterEmployeeId: string;
  requesterUserId: string;
  title: string;
  description?: string;
  currentStageIndex: number;
  currentStageSlug?: string;
  status: string;
  metadata: Record<string, unknown>;
  pendingApproverEmployeeIds: string[];
  pendingApproverUserIds: string[];
  slaDueAt?: Date;
  escalatedAt?: Date;
  submittedAt?: Date;
  completedAt?: Date;
}

export interface ApprovalActionDocument extends BaseDocument {
  approvalRequestId: string;
  stageSlug?: string;
  stageOrder?: number;
  actorEmployeeId?: string;
  actorUserId: string;
  action: string;
  comments?: string;
  delegatedToEmployeeId?: string;
  metadata: Record<string, unknown>;
}

export interface ApprovalAttachmentDocument extends BaseDocument {
  approvalRequestId: string;
  fileName: string;
  fileUrl: string;
  publicId?: string;
  mimeType: string;
  fileSize: number;
  uploadedBy: string;
}

export interface ApprovalTimelineEntryDocument extends BaseDocument {
  approvalRequestId: string;
  eventType: string;
  title: string;
  description?: string;
  actorUserId?: string;
  actorEmployeeId?: string;
  metadata: Record<string, unknown>;
  occurredAt: Date;
}

const approvalWorkflowFields: SchemaDefinition = {
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true, index: true },
  requestType: { type: String, required: true, trim: true, index: true },
  description: { type: String, trim: true },
  stages: { type: [Schema.Types.Mixed], default: [] },
  isDefault: { type: Boolean, default: false },
  status: { type: String, enum: Object.values(ENTITY_STATUS), default: ENTITY_STATUS.ACTIVE },
};

const approvalRequestFields: SchemaDefinition = {
  requestType: { type: String, required: true, trim: true, index: true },
  entityType: { type: String, required: true, trim: true, index: true },
  entityId: { type: String, required: true, index: true },
  workflowId: { type: String, required: true, index: true },
  workflowSlug: { type: String, required: true, trim: true },
  requesterEmployeeId: { type: String, required: true, index: true },
  requesterUserId: { type: String, required: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  currentStageIndex: { type: Number, default: 0 },
  currentStageSlug: { type: String, trim: true },
  status: { type: String, enum: Object.values(APPROVAL_REQUEST_STATUS), default: APPROVAL_REQUEST_STATUS.DRAFT, index: true },
  metadata: { type: Schema.Types.Mixed, default: {} },
  pendingApproverEmployeeIds: { type: [String], default: [] },
  pendingApproverUserIds: { type: [String], default: [] },
  slaDueAt: { type: Date, index: true },
  escalatedAt: { type: Date },
  submittedAt: { type: Date },
  completedAt: { type: Date },
};

const approvalActionFields: SchemaDefinition = {
  approvalRequestId: { type: String, required: true, index: true },
  stageSlug: { type: String, trim: true },
  stageOrder: { type: Number },
  actorEmployeeId: { type: String, index: true },
  actorUserId: { type: String, required: true, index: true },
  action: { type: String, enum: Object.values(APPROVAL_ACTION_TYPE), required: true },
  comments: { type: String, trim: true },
  delegatedToEmployeeId: { type: String, index: true },
  metadata: { type: Schema.Types.Mixed, default: {} },
};

const approvalAttachmentFields: SchemaDefinition = {
  approvalRequestId: { type: String, required: true, index: true },
  fileName: { type: String, required: true, trim: true },
  fileUrl: { type: String, required: true },
  publicId: { type: String, trim: true },
  mimeType: { type: String, required: true },
  fileSize: { type: Number, required: true, min: 0 },
  uploadedBy: { type: String, required: true },
};

const approvalTimelineFields: SchemaDefinition = {
  approvalRequestId: { type: String, required: true, index: true },
  eventType: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  actorUserId: { type: String, index: true },
  actorEmployeeId: { type: String, index: true },
  metadata: { type: Schema.Types.Mixed, default: {} },
  occurredAt: { type: Date, required: true, default: Date.now, index: true },
};

export const approvalWorkflowModel = defineDomainModel<ApprovalWorkflowDocument>(
  'ApprovalWorkflow',
  COLLECTIONS.APPROVAL_WORKFLOWS,
  approvalWorkflowFields,
  {
    indexes: [
      { fields: { companyId: 1, slug: 1 }, options: { unique: true, name: 'uq_approval_workflows_slug' } },
      { fields: { companyId: 1, requestType: 1, isDefault: 1 }, options: { name: 'idx_approval_workflows_type_default' } },
    ],
  },
);

export const approvalRequestModel = defineDomainModel<ApprovalRequestDocument>(
  'ApprovalRequest',
  COLLECTIONS.APPROVAL_REQUESTS,
  approvalRequestFields,
  {
    indexes: [
      { fields: { companyId: 1, entityType: 1, entityId: 1 }, options: { name: 'idx_approval_requests_entity' } },
      { fields: { companyId: 1, requesterEmployeeId: 1, status: 1 }, options: { name: 'idx_approval_requests_requester_status' } },
      { fields: { companyId: 1, pendingApproverEmployeeIds: 1, status: 1 }, options: { name: 'idx_approval_requests_pending_approvers' } },
    ],
  },
);

export const approvalActionModel = defineDomainModel<ApprovalActionDocument>(
  'ApprovalAction',
  COLLECTIONS.APPROVAL_ACTIONS,
  approvalActionFields,
  {
    indexes: [
      { fields: { companyId: 1, approvalRequestId: 1, createdAt: -1 }, options: { name: 'idx_approval_actions_request_date' } },
    ],
  },
);

export const approvalAttachmentModel = defineDomainModel<ApprovalAttachmentDocument>(
  'ApprovalAttachment',
  COLLECTIONS.APPROVAL_ATTACHMENTS,
  approvalAttachmentFields,
  {
    indexes: [
      { fields: { companyId: 1, approvalRequestId: 1 }, options: { name: 'idx_approval_attachments_request' } },
    ],
  },
);

export const approvalTimelineModel = defineDomainModel<ApprovalTimelineEntryDocument>(
  'ApprovalTimelineEntry',
  COLLECTIONS.APPROVAL_TIMELINE_ENTRIES,
  approvalTimelineFields,
  {
    withSoftDelete: false,
    indexes: [
      { fields: { companyId: 1, approvalRequestId: 1, occurredAt: -1 }, options: { name: 'idx_approval_timeline_request_date' } },
    ],
  },
);

export const ApprovalWorkflowRepository = approvalWorkflowModel.repository;
export const ApprovalRequestRepository = approvalRequestModel.repository;
export const ApprovalActionRepository = approvalActionModel.repository;
export const ApprovalAttachmentRepository = approvalAttachmentModel.repository;
export const ApprovalTimelineRepository = approvalTimelineModel.repository;
