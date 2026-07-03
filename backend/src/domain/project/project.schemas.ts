import { type SchemaDefinition } from 'mongoose';
import { defineDomainModel } from '@infrastructure/database/model.factory.js';
import { COLLECTIONS } from '@infrastructure/database/constants/collections.js';
import type { BaseDocument } from '@infrastructure/database/types/base-document.types.js';
import { PROJECT_STATUS } from '@shared/constants/status.constants.js';
import { PROJECT_KIND } from '@shared/constants/status.constants.js';
import {
  PROJECT_MEMBER_ROLE,
  PROJECT_PRIORITY,
  PROJECT_RISK_LEVEL,
  PROJECT_TASK_STATUS,
  PROJECT_VISIBILITY,
  TASK_TYPE,
} from '@domain/project/project-extended.schemas.js';

export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export const SPRINT_STATUS = {
  PLANNED: 'planned',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const MILESTONE_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  MISSED: 'missed',
} as const;

export interface ProjectDocument extends BaseDocument {
  name: string;
  code: string;
  description?: string;
  status: string;
  priority: string;
  projectKind?: string;
  categoryId?: string;
  branchId?: string;
  departmentId?: string;
  startDate?: Date;
  targetDate?: Date;
  endDate?: Date;
  completedAt?: Date;
  projectManagerId: string;
  clientName?: string;
  requirements?: string;
  uiDocs?: string;
  scalabilityNotes?: string;
  budget?: number;
  currency?: string;
  repositoryUrl?: string;
  productionUrl?: string;
  stagingUrl?: string;
  apiUrl?: string;
  documentationUrl?: string;
  logoUrl?: string;
  logoPublicId?: string;
  tags: string[];
  technologyIds: string[];
  riskLevel: string;
  visibility: string;
  isArchived: boolean;
}

export interface SprintDocument extends BaseDocument {
  projectId: string;
  name: string;
  goal?: string;
  startDate: Date;
  endDate: Date;
  status: string;
  capacityHours?: number;
  velocity?: number;
}

export interface TaskDocument extends BaseDocument {
  projectId: string;
  moduleId?: string;
  milestoneId?: string;
  sprintId?: string;
  parentTaskId?: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  taskType: string;
  assigneeId?: string;
  reporterId: string;
  verifierId?: string;
  dueDate?: Date;
  storyPoints?: number;
  estimatedHours?: number;
  actualHours?: number;
  labels: string[];
  dependencyTaskIds: string[];
  blockedReason?: string;
  riskLevel?: string;
  isRecurring: boolean;
  checklist: { title: string; isCompleted: boolean }[];
  progressPercent: number;
}

export interface SubTaskDocument extends BaseDocument {
  taskId: string;
  parentSubTaskId?: string;
  title: string;
  status: string;
  assigneeId?: string;
  isCompleted: boolean;
  sortOrder: number;
}

export interface TaskCommentDocument extends BaseDocument {
  taskId: string;
  authorId: string;
  content: string;
  isEdited: boolean;
  editedAt?: Date;
}

export interface TaskAttachmentDocument extends BaseDocument {
  taskId: string;
  fileName: string;
  fileUrl: string;
  publicId?: string;
  mimeType: string;
  fileSize: number;
  uploadedBy: string;
}

export interface ProjectMemberDocument extends BaseDocument {
  projectId: string;
  employeeId: string;
  role: string;
  joinedAt: Date;
  leftAt?: Date;
  allocationPercent: number;
}

export interface MilestoneDocument extends BaseDocument {
  projectId: string;
  name: string;
  description?: string;
  dueDate: Date;
  status: string;
  completedAt?: Date;
  completionPercent: number;
  dependencyMilestoneIds: string[];
}

const projectFields: SchemaDefinition = {
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  description: { type: String, trim: true },
  status: { type: String, enum: Object.values(PROJECT_STATUS), default: PROJECT_STATUS.PLANNING },
  priority: { type: String, enum: Object.values(PROJECT_PRIORITY), default: PROJECT_PRIORITY.MEDIUM },
  projectKind: { type: String, enum: Object.values(PROJECT_KIND), default: PROJECT_KIND.INTERNAL },
  categoryId: { type: String, index: true },
  branchId: { type: String, index: true },
  departmentId: { type: String, index: true },
  startDate: { type: Date },
  targetDate: { type: Date },
  endDate: { type: Date },
  completedAt: { type: Date },
  projectManagerId: { type: String, required: true, index: true },
  clientName: { type: String, trim: true },
  requirements: { type: String, trim: true },
  uiDocs: { type: String, trim: true },
  scalabilityNotes: { type: String, trim: true },
  budget: { type: Number, min: 0 },
  currency: { type: String, default: 'INR' },
  repositoryUrl: { type: String, trim: true },
  productionUrl: { type: String, trim: true },
  stagingUrl: { type: String, trim: true },
  apiUrl: { type: String, trim: true },
  documentationUrl: { type: String, trim: true },
  logoUrl: { type: String },
  logoPublicId: { type: String },
  tags: { type: [String], default: [] },
  technologyIds: { type: [String], default: [] },
  riskLevel: { type: String, enum: Object.values(PROJECT_RISK_LEVEL), default: PROJECT_RISK_LEVEL.LOW },
  visibility: { type: String, enum: Object.values(PROJECT_VISIBILITY), default: PROJECT_VISIBILITY.INTERNAL },
  isArchived: { type: Boolean, default: false, index: true },
};

const sprintFields: SchemaDefinition = {
  projectId: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true },
  goal: { type: String, trim: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: Object.values(SPRINT_STATUS), default: SPRINT_STATUS.PLANNED },
  capacityHours: { type: Number, min: 0 },
  velocity: { type: Number, min: 0 },
};

const taskFields: SchemaDefinition = {
  projectId: { type: String, required: true, index: true },
  moduleId: { type: String, index: true },
  milestoneId: { type: String, index: true },
  sprintId: { type: String, index: true },
  parentTaskId: { type: String, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  status: { type: String, enum: Object.values(PROJECT_TASK_STATUS), default: PROJECT_TASK_STATUS.BACKLOG },
  priority: { type: String, enum: Object.values(TASK_PRIORITY), default: TASK_PRIORITY.MEDIUM },
  taskType: { type: String, enum: Object.values(TASK_TYPE), default: TASK_TYPE.FEATURE },
  assigneeId: { type: String, index: true },
  reporterId: { type: String, required: true, index: true },
  verifierId: { type: String, index: true },
  dueDate: { type: Date, index: true },
  storyPoints: { type: Number, min: 0 },
  estimatedHours: { type: Number, min: 0 },
  actualHours: { type: Number, min: 0, default: 0 },
  labels: { type: [String], default: [] },
  dependencyTaskIds: { type: [String], default: [] },
  blockedReason: { type: String, trim: true },
  riskLevel: { type: String, enum: Object.values(PROJECT_RISK_LEVEL) },
  isRecurring: { type: Boolean, default: false },
  checklist: {
    type: [{ title: String, isCompleted: { type: Boolean, default: false } }],
    default: [],
  },
  progressPercent: { type: Number, default: 0, min: 0, max: 100 },
};

const subTaskFields: SchemaDefinition = {
  taskId: { type: String, required: true, index: true },
  parentSubTaskId: { type: String, index: true },
  title: { type: String, required: true, trim: true },
  status: { type: String, enum: Object.values(PROJECT_TASK_STATUS), default: PROJECT_TASK_STATUS.TODO },
  assigneeId: { type: String, index: true },
  isCompleted: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
};

const taskCommentFields: SchemaDefinition = {
  taskId: { type: String, required: true, index: true },
  authorId: { type: String, required: true, index: true },
  content: { type: String, required: true, trim: true },
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date },
};

const taskAttachmentFields: SchemaDefinition = {
  taskId: { type: String, required: true, index: true },
  fileName: { type: String, required: true, trim: true },
  fileUrl: { type: String, required: true },
  publicId: { type: String },
  mimeType: { type: String, required: true },
  fileSize: { type: Number, required: true, min: 0 },
  uploadedBy: { type: String, required: true },
};

const projectMemberFields: SchemaDefinition = {
  projectId: { type: String, required: true, index: true },
  employeeId: { type: String, required: true, index: true },
  role: { type: String, enum: Object.values(PROJECT_MEMBER_ROLE), default: PROJECT_MEMBER_ROLE.DEVELOPER },
  joinedAt: { type: Date, required: true, default: Date.now },
  leftAt: { type: Date },
  allocationPercent: { type: Number, default: 100, min: 0, max: 100 },
};

const milestoneFields: SchemaDefinition = {
  projectId: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  dueDate: { type: Date, required: true, index: true },
  status: { type: String, enum: Object.values(MILESTONE_STATUS), default: MILESTONE_STATUS.PENDING },
  completedAt: { type: Date },
  completionPercent: { type: Number, default: 0, min: 0, max: 100 },
  dependencyMilestoneIds: { type: [String], default: [] },
};

export const projectModel = defineDomainModel<ProjectDocument>(
  'Project',
  COLLECTIONS.PROJECTS,
  projectFields,
  {
    searchFields: ['name', 'code', 'description', 'clientName'],
    indexes: [
      { fields: { companyId: 1, code: 1 }, options: { unique: true, name: 'uq_projects_company_code' } },
      { fields: { companyId: 1, status: 1 }, options: { name: 'idx_projects_company_status' } },
      { fields: { companyId: 1, projectManagerId: 1, status: 1 }, options: { name: 'idx_projects_company_manager_status' } },
      { fields: { companyId: 1, isArchived: 1 }, options: { name: 'idx_projects_company_archived' } },
    ],
  },
);

export const sprintModel = defineDomainModel<SprintDocument>(
  'Sprint',
  COLLECTIONS.SPRINTS,
  sprintFields,
  {
    indexes: [
      { fields: { companyId: 1, projectId: 1, startDate: -1 }, options: { name: 'idx_sprints_company_project_date' } },
      { fields: { companyId: 1, projectId: 1, status: 1 }, options: { name: 'idx_sprints_company_project_status' } },
    ],
  },
);

export const taskModel = defineDomainModel<TaskDocument>(
  'Task',
  COLLECTIONS.TASKS,
  taskFields,
  {
    searchFields: ['title', 'description'],
    indexes: [
      { fields: { companyId: 1, projectId: 1, status: 1 }, options: { name: 'idx_tasks_company_project_status' } },
      { fields: { companyId: 1, assigneeId: 1, status: 1 }, options: { name: 'idx_tasks_company_assignee_status' } },
      { fields: { companyId: 1, sprintId: 1 }, options: { name: 'idx_tasks_company_sprint', sparse: true } },
      { fields: { companyId: 1, dueDate: 1 }, options: { name: 'idx_tasks_company_due_date' } },
    ],
  },
);

export const subTaskModel = defineDomainModel<SubTaskDocument>(
  'SubTask',
  COLLECTIONS.SUB_TASKS,
  subTaskFields,
  {
    indexes: [
      { fields: { companyId: 1, taskId: 1, sortOrder: 1 }, options: { name: 'idx_sub_tasks_company_task' } },
    ],
  },
);

export const taskCommentModel = defineDomainModel<TaskCommentDocument>(
  'TaskComment',
  COLLECTIONS.TASK_COMMENTS,
  taskCommentFields,
  {
    indexes: [
      { fields: { companyId: 1, taskId: 1, createdAt: -1 }, options: { name: 'idx_task_comments_company_task_date' } },
    ],
  },
);

export const taskAttachmentModel = defineDomainModel<TaskAttachmentDocument>(
  'TaskAttachment',
  COLLECTIONS.TASK_ATTACHMENTS,
  taskAttachmentFields,
  {
    indexes: [
      { fields: { companyId: 1, taskId: 1 }, options: { name: 'idx_task_attachments_company_task' } },
    ],
  },
);

export const projectMemberModel = defineDomainModel<ProjectMemberDocument>(
  'ProjectMember',
  COLLECTIONS.PROJECT_MEMBERS,
  projectMemberFields,
  {
    indexes: [
      { fields: { companyId: 1, projectId: 1, employeeId: 1 }, options: { unique: true, name: 'uq_project_members' } },
    ],
  },
);

export const milestoneModel = defineDomainModel<MilestoneDocument>(
  'Milestone',
  COLLECTIONS.MILESTONES,
  milestoneFields,
  {
    indexes: [
      { fields: { companyId: 1, projectId: 1, dueDate: 1 }, options: { name: 'idx_milestones_company_project_due' } },
      { fields: { companyId: 1, projectId: 1, status: 1 }, options: { name: 'idx_milestones_company_project_status' } },
    ],
  },
);

export const ProjectModel = projectModel.model;
export const SprintModel = sprintModel.model;
export const TaskModel = taskModel.model;
export const SubTaskModel = subTaskModel.model;
export const TaskCommentModel = taskCommentModel.model;
export const TaskAttachmentModel = taskAttachmentModel.model;
export const ProjectMemberModel = projectMemberModel.model;
export const MilestoneModel = milestoneModel.model;

export const ProjectRepository = projectModel.repository;
export const SprintRepository = sprintModel.repository;
export const TaskRepository = taskModel.repository;
export const SubTaskRepository = subTaskModel.repository;
export const TaskCommentRepository = taskCommentModel.repository;
export const TaskAttachmentRepository = taskAttachmentModel.repository;
export const ProjectMemberRepository = projectMemberModel.repository;
export const MilestoneRepository = milestoneModel.repository;
