import { Schema, type SchemaDefinition } from 'mongoose';
import { defineDomainModel } from '@infrastructure/database/model.factory.js';
import { COLLECTIONS } from '@infrastructure/database/constants/collections.js';
import type { BaseDocument } from '@infrastructure/database/types/base-document.types.js';

export const PROJECT_TASK_STATUS = {
  BACKLOG: 'backlog',
  TODO: 'todo',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  VERIFIED: 'verified',
  CLOSED: 'closed',
  REJECTED: 'rejected',
  BLOCKED: 'blocked',
  CANCELLED: 'cancelled',
} as const;

export const PROJECT_MEMBER_ROLE = {
  PROJECT_MANAGER: 'project_manager',
  ASSISTANT_PROJECT_MANAGER: 'assistant_project_manager',
  DEVELOPER: 'developer',
  QA: 'qa',
  DESIGNER: 'designer',
  DEVOPS: 'devops',
  BUSINESS_ANALYST: 'business_analyst',
  INTERN: 'intern',
  OWNER: 'owner',
  VIEWER: 'viewer',
} as const;

export const PROJECT_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export const PROJECT_VISIBILITY = {
  PUBLIC: 'public',
  INTERNAL: 'internal',
  PRIVATE: 'private',
} as const;

export const PROJECT_RISK_LEVEL = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export const TASK_TYPE = {
  FEATURE: 'feature',
  BUG: 'bug',
  IMPROVEMENT: 'improvement',
  SPIKE: 'spike',
  CHORE: 'chore',
  EPIC: 'epic',
} as const;

export const MODULE_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ON_HOLD: 'on_hold',
} as const;

export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REVISION: 'revision',
} as const;

export const PROJECT_ACTIVITY_TYPE = {
  PROJECT_CREATED: 'project.created',
  PROJECT_ARCHIVED: 'project.archived',
  TASK_ASSIGNED: 'task.assigned',
  TASK_COMPLETED: 'task.completed',
  TASK_REJECTED: 'task.rejected',
  TASK_VERIFIED: 'task.verified',
  SPRINT_STARTED: 'sprint.started',
  MILESTONE_COMPLETED: 'milestone.completed',
  MEMBER_ADDED: 'project.member_added',
} as const;

export interface ProjectModuleDocument extends BaseDocument {
  projectId: string;
  name: string;
  description?: string;
  status: string;
  leadId?: string;
  progressPercent: number;
  estimatedHours?: number;
  actualHours?: number;
  dependencyModuleIds: string[];
  sortOrder: number;
}

export interface TaskAssignmentHistoryDocument extends BaseDocument {
  taskId: string;
  projectId: string;
  assignedBy: string;
  assignedTo: string;
  previousAssigneeId?: string;
  reason?: string;
  isReassignment: boolean;
  assignedAt: Date;
}

export interface TaskVerificationDocument extends BaseDocument {
  taskId: string;
  projectId: string;
  submittedBy: string;
  verifierId: string;
  status: string;
  comment?: string;
  revisionNotes?: string;
  verifiedAt?: Date;
}

export interface DailyWorkLogDocument extends BaseDocument {
  projectId: string;
  taskId?: string;
  employeeId: string;
  workDate: Date;
  description: string;
  hours: number;
  progressPercent?: number;
  blockers?: string;
  managerComment?: string;
  attachmentUrls: string[];
}

export interface ProjectKnowledgeBaseDocument extends BaseDocument {
  projectId: string;
  repositoryUrl?: string;
  branches: string[];
  apiDocsUrl?: string;
  swaggerUrl?: string;
  encryptedCredentials?: string;
  encryptedEnvVariables?: string;
  deploymentGuide?: string;
  architectureNotes?: string;
  cloudflareEmail?: string;
  devHostingPlatform?: string;
  prodHostingPlatform?: string;
  documentUrls: string[];
}

export interface ProjectDocumentFileDocument extends BaseDocument {
  projectId: string;
  fileName: string;
  fileUrl: string;
  publicId?: string;
  mimeType: string;
  fileSize: number;
  uploadedBy: string;
}

export interface TaskWorkflowConfigDocument extends BaseDocument {
  projectId?: string;
  slug: string;
  name: string;
  sortOrder: number;
  isTerminal: boolean;
  isDefault: boolean;
}

export interface ProjectDraftDocument extends BaseDocument {
  userId: string;
  currentStep: string;
  payload: Record<string, unknown>;
}

export interface ProjectMemberHistoryDocument extends BaseDocument {
  projectId: string;
  employeeId: string;
  action: string;
  role: string;
  previousRole?: string;
  allocationPercent?: number;
  performedBy: string;
  performedAt: Date;
  notes?: string;
}

const projectModuleFields: SchemaDefinition = {
  projectId: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  status: { type: String, enum: Object.values(MODULE_STATUS), default: MODULE_STATUS.NOT_STARTED },
  leadId: { type: String, index: true },
  progressPercent: { type: Number, default: 0, min: 0, max: 100 },
  estimatedHours: { type: Number, min: 0 },
  actualHours: { type: Number, min: 0, default: 0 },
  dependencyModuleIds: { type: [String], default: [] },
  sortOrder: { type: Number, default: 0 },
};

const taskAssignmentHistoryFields: SchemaDefinition = {
  taskId: { type: String, required: true, index: true },
  projectId: { type: String, required: true, index: true },
  assignedBy: { type: String, required: true, index: true },
  assignedTo: { type: String, required: true, index: true },
  previousAssigneeId: { type: String },
  reason: { type: String, trim: true },
  isReassignment: { type: Boolean, default: false },
  assignedAt: { type: Date, required: true, default: Date.now },
};

const taskVerificationFields: SchemaDefinition = {
  taskId: { type: String, required: true, index: true },
  projectId: { type: String, required: true, index: true },
  submittedBy: { type: String, required: true, index: true },
  verifierId: { type: String, required: true, index: true },
  status: {
    type: String,
    enum: Object.values(VERIFICATION_STATUS),
    default: VERIFICATION_STATUS.PENDING,
  },
  comment: { type: String, trim: true },
  revisionNotes: { type: String, trim: true },
  verifiedAt: { type: Date },
};

const dailyWorkLogFields: SchemaDefinition = {
  projectId: { type: String, required: true, index: true },
  taskId: { type: String, index: true },
  employeeId: { type: String, required: true, index: true },
  workDate: { type: Date, required: true, index: true },
  description: { type: String, required: true, trim: true },
  hours: { type: Number, required: true, min: 0, max: 24 },
  progressPercent: { type: Number, min: 0, max: 100 },
  blockers: { type: String, trim: true },
  managerComment: { type: String, trim: true },
  attachmentUrls: { type: [String], default: [] },
};

const projectKnowledgeBaseFields: SchemaDefinition = {
  projectId: { type: String, required: true, index: true, unique: true },
  repositoryUrl: { type: String, trim: true },
  branches: { type: [String], default: [] },
  apiDocsUrl: { type: String, trim: true },
  swaggerUrl: { type: String, trim: true },
  encryptedCredentials: { type: String },
  encryptedEnvVariables: { type: String },
  deploymentGuide: { type: String, trim: true },
  architectureNotes: { type: String, trim: true },
  cloudflareEmail: { type: String, trim: true, lowercase: true },
  devHostingPlatform: { type: String, trim: true },
  prodHostingPlatform: { type: String, trim: true },
  documentUrls: { type: [String], default: [] },
};

const projectDocumentFileFields: SchemaDefinition = {
  projectId: { type: String, required: true, index: true },
  fileName: { type: String, required: true, trim: true },
  fileUrl: { type: String, required: true },
  publicId: { type: String },
  mimeType: { type: String, required: true },
  fileSize: { type: Number, required: true, min: 0 },
  uploadedBy: { type: String, required: true },
};

const taskWorkflowConfigFields: SchemaDefinition = {
  projectId: { type: String, index: true },
  slug: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  sortOrder: { type: Number, default: 0 },
  isTerminal: { type: Boolean, default: false },
  isDefault: { type: Boolean, default: false },
};

const projectDraftFields: SchemaDefinition = {
  userId: { type: String, required: true, index: true },
  currentStep: { type: String, required: true, default: 'basic' },
  payload: { type: Schema.Types.Mixed, default: {} },
};

const projectMemberHistoryFields: SchemaDefinition = {
  projectId: { type: String, required: true, index: true },
  employeeId: { type: String, required: true, index: true },
  action: { type: String, required: true },
  role: { type: String, required: true },
  previousRole: { type: String },
  allocationPercent: { type: Number, min: 0, max: 100 },
  performedBy: { type: String, required: true },
  performedAt: { type: Date, required: true },
  notes: { type: String },
};

export const projectModuleModel = defineDomainModel<ProjectModuleDocument>(
  'ProjectModule',
  COLLECTIONS.PROJECT_MODULES,
  projectModuleFields,
  {
    indexes: [
      {
        fields: { companyId: 1, projectId: 1, sortOrder: 1 },
        options: { name: 'idx_project_modules_company_project' },
      },
    ],
  },
);

export const taskAssignmentHistoryModel = defineDomainModel<TaskAssignmentHistoryDocument>(
  'TaskAssignmentHistory',
  COLLECTIONS.TASK_ASSIGNMENT_HISTORY,
  taskAssignmentHistoryFields,
  {
    withSoftDelete: false,
    indexes: [
      {
        fields: { companyId: 1, taskId: 1, assignedAt: -1 },
        options: { name: 'idx_task_assignment_history_task' },
      },
    ],
  },
);

export const taskVerificationModel = defineDomainModel<TaskVerificationDocument>(
  'TaskVerification',
  COLLECTIONS.TASK_VERIFICATIONS,
  taskVerificationFields,
  {
    indexes: [
      {
        fields: { companyId: 1, taskId: 1, createdAt: -1 },
        options: { name: 'idx_task_verifications_task' },
      },
    ],
  },
);

export const dailyWorkLogModel = defineDomainModel<DailyWorkLogDocument>(
  'DailyWorkLog',
  COLLECTIONS.DAILY_WORK_LOGS,
  dailyWorkLogFields,
  {
    indexes: [
      {
        fields: { companyId: 1, projectId: 1, workDate: -1 },
        options: { name: 'idx_daily_work_logs_project_date' },
      },
      {
        fields: { companyId: 1, employeeId: 1, workDate: -1 },
        options: { name: 'idx_daily_work_logs_employee_date' },
      },
    ],
  },
);

export const projectKnowledgeBaseModel = defineDomainModel<ProjectKnowledgeBaseDocument>(
  'ProjectKnowledgeBase',
  COLLECTIONS.PROJECT_KNOWLEDGE_BASES,
  projectKnowledgeBaseFields,
  {
    indexes: [
      {
        fields: { companyId: 1, projectId: 1 },
        options: { unique: true, name: 'uq_project_knowledge_bases' },
      },
    ],
  },
);

export const projectDocumentFileModel = defineDomainModel<ProjectDocumentFileDocument>(
  'ProjectDocumentFile',
  COLLECTIONS.PROJECT_DOCUMENTS,
  projectDocumentFileFields,
  {
    indexes: [
      {
        fields: { companyId: 1, projectId: 1 },
        options: { name: 'idx_project_documents_company_project' },
      },
    ],
  },
);

export const taskWorkflowConfigModel = defineDomainModel<TaskWorkflowConfigDocument>(
  'TaskWorkflowConfig',
  COLLECTIONS.TASK_WORKFLOW_CONFIGS,
  taskWorkflowConfigFields,
  {
    indexes: [
      {
        fields: { companyId: 1, projectId: 1, slug: 1 },
        options: { unique: true, name: 'uq_task_workflow_configs' },
      },
    ],
  },
);

export const projectDraftModel = defineDomainModel<ProjectDraftDocument>(
  'ProjectDraft',
  COLLECTIONS.PROJECT_DRAFTS,
  projectDraftFields,
  {
    withSoftDelete: false,
    indexes: [
      {
        fields: { companyId: 1, userId: 1 },
        options: { unique: true, name: 'uq_project_drafts_user' },
      },
    ],
  },
);

export const projectMemberHistoryModel = defineDomainModel<ProjectMemberHistoryDocument>(
  'ProjectMemberHistory',
  COLLECTIONS.PROJECT_MEMBER_HISTORY,
  projectMemberHistoryFields,
  {
    withSoftDelete: false,
    indexes: [
      {
        fields: { companyId: 1, projectId: 1, performedAt: -1 },
        options: { name: 'idx_project_member_history_project' },
      },
      {
        fields: { companyId: 1, employeeId: 1, performedAt: -1 },
        options: { name: 'idx_project_member_history_employee' },
      },
    ],
  },
);

export const ProjectModuleRepository = projectModuleModel.repository;
export const TaskAssignmentHistoryRepository = taskAssignmentHistoryModel.repository;
export const TaskVerificationRepository = taskVerificationModel.repository;
export const DailyWorkLogRepository = dailyWorkLogModel.repository;
export const ProjectKnowledgeBaseRepository = projectKnowledgeBaseModel.repository;
export const ProjectDocumentFileRepository = projectDocumentFileModel.repository;
export const TaskWorkflowConfigRepository = taskWorkflowConfigModel.repository;
export const ProjectDraftRepository = projectDraftModel.repository;
export const ProjectMemberHistoryRepository = projectMemberHistoryModel.repository;
