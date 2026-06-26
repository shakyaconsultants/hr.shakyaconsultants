import { z } from 'zod';
import { PROJECT_STATUS } from '@shared/constants/status.constants.js';
import {
  PROJECT_MEMBER_ROLE,
  PROJECT_PRIORITY,
  PROJECT_RISK_LEVEL,
  PROJECT_TASK_STATUS,
  PROJECT_VISIBILITY,
  TASK_TYPE,
  MODULE_STATUS,
} from '@domain/project/project-extended.schemas.js';
import { SPRINT_STATUS, TASK_PRIORITY } from '@domain/project/project.schemas.js';

export const idParamSchema = z.object({ id: z.uuid() });
export const projectIdParamSchema = z.object({ projectId: z.uuid() });
export const taskIdParamSchema = z.object({ taskId: z.uuid() });

export const projectListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  status: z.enum(Object.values(PROJECT_STATUS) as [string, ...string[]]).optional(),
  priority: z.enum(Object.values(PROJECT_PRIORITY) as [string, ...string[]]).optional(),
  departmentId: z.uuid().optional(),
  branchId: z.uuid().optional(),
  projectManagerId: z.uuid().optional(),
  includeArchived: z.coerce.boolean().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(2).max(20),
  description: z.string().optional(),
  status: z.enum(Object.values(PROJECT_STATUS) as [string, ...string[]]).optional(),
  priority: z.enum(Object.values(PROJECT_PRIORITY) as [string, ...string[]]).optional(),
  categoryId: z.uuid().optional(),
  branchId: z.uuid().optional(),
  departmentId: z.uuid().optional(),
  startDate: z.coerce.date(),
  targetDate: z.coerce.date().optional(),
  projectManagerId: z.uuid(),
  clientName: z.string().optional(),
  budget: z.coerce.number().min(0).optional(),
  currency: z.string().optional(),
  repositoryUrl: z.string().optional(),
  productionUrl: z.string().optional(),
  stagingUrl: z.string().optional(),
  apiUrl: z.string().optional(),
  documentationUrl: z.string().optional(),
  tags: z.array(z.string()).optional(),
  technologyIds: z.array(z.uuid()).optional(),
  riskLevel: z.enum(Object.values(PROJECT_RISK_LEVEL) as [string, ...string[]]).optional(),
  visibility: z.enum(Object.values(PROJECT_VISIBILITY) as [string, ...string[]]).optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const taskListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  projectId: z.uuid().optional(),
  sprintId: z.uuid().optional(),
  moduleId: z.uuid().optional(),
  milestoneId: z.uuid().optional(),
  assigneeId: z.uuid().optional(),
  status: z.enum(Object.values(PROJECT_TASK_STATUS) as [string, ...string[]]).optional(),
  priority: z.enum(Object.values(TASK_PRIORITY) as [string, ...string[]]).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const createTaskSchema = z.object({
  projectId: z.uuid(),
  moduleId: z.uuid().optional(),
  milestoneId: z.uuid().optional(),
  sprintId: z.uuid().optional(),
  parentTaskId: z.uuid().optional(),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  status: z.enum(Object.values(PROJECT_TASK_STATUS) as [string, ...string[]]).optional(),
  priority: z.enum(Object.values(TASK_PRIORITY) as [string, ...string[]]).optional(),
  taskType: z.enum(Object.values(TASK_TYPE) as [string, ...string[]]).optional(),
  assigneeId: z.uuid().optional(),
  reporterId: z.uuid().optional(),
  verifierId: z.uuid().optional(),
  dueDate: z.coerce.date().optional(),
  storyPoints: z.coerce.number().min(0).optional(),
  estimatedHours: z.coerce.number().min(0).optional(),
  labels: z.array(z.string()).optional(),
  dependencyTaskIds: z.array(z.uuid()).optional(),
  blockedReason: z.string().optional(),
  riskLevel: z.enum(Object.values(PROJECT_RISK_LEVEL) as [string, ...string[]]).optional(),
  isRecurring: z.boolean().optional(),
  assignmentReason: z.string().optional(),
});

export const updateTaskSchema = createTaskSchema.partial().omit({ projectId: true });

export const createMemberSchema = z.object({
  projectId: z.uuid(),
  employeeId: z.uuid(),
  role: z.enum(Object.values(PROJECT_MEMBER_ROLE) as [string, ...string[]]),
  joinedAt: z.coerce.date().optional(),
  allocationPercent: z.coerce.number().min(0).max(100).optional(),
});

export const createModuleSchema = z.object({
  projectId: z.uuid(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(Object.values(MODULE_STATUS) as [string, ...string[]]).optional(),
  leadId: z.uuid().optional(),
  estimatedHours: z.coerce.number().min(0).optional(),
  dependencyModuleIds: z.array(z.uuid()).optional(),
  sortOrder: z.coerce.number().optional(),
});

export const createMilestoneSchema = z.object({
  projectId: z.uuid(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  dueDate: z.coerce.date(),
  dependencyMilestoneIds: z.array(z.uuid()).optional(),
});

export const createSprintSchema = z.object({
  projectId: z.uuid(),
  name: z.string().min(1).max(200),
  goal: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  capacityHours: z.coerce.number().min(0).optional(),
  status: z.enum(Object.values(SPRINT_STATUS) as [string, ...string[]]).optional(),
});

export const createSubTaskSchema = z.object({
  taskId: z.uuid(),
  parentSubTaskId: z.uuid().optional(),
  title: z.string().min(1).max(500),
  assigneeId: z.uuid().optional(),
  sortOrder: z.coerce.number().optional(),
});

export const taskCommentSchema = z.object({ content: z.string().min(1) });

export const verificationSubmitSchema = z.object({ verifierId: z.uuid() });
export const verificationDecisionSchema = z.object({
  comment: z.string().optional(),
  revisionNotes: z.string().optional(),
});

export const workLogSchema = z.object({
  projectId: z.uuid(),
  taskId: z.uuid().optional(),
  employeeId: z.uuid().optional(),
  workDate: z.coerce.date(),
  description: z.string().min(1),
  hours: z.coerce.number().min(0).max(24),
  progressPercent: z.coerce.number().min(0).max(100).optional(),
  blockers: z.string().optional(),
  attachmentUrls: z.array(z.string()).optional(),
});

export const knowledgeBaseSchema = z.object({
  repositoryUrl: z.string().optional(),
  branches: z.array(z.string()).optional(),
  apiDocsUrl: z.string().optional(),
  swaggerUrl: z.string().optional(),
  credentials: z.string().optional(),
  envVariables: z.string().optional(),
  deploymentGuide: z.string().optional(),
  architectureNotes: z.string().optional(),
  documentUrls: z.array(z.string()).optional(),
});

export const bulkTaskStatusSchema = z.object({
  taskIds: z.array(z.uuid()).min(1),
  status: z.enum(Object.values(PROJECT_TASK_STATUS) as [string, ...string[]]),
});

export const managerCommentSchema = z.object({ comment: z.string().min(1) });

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
export type CreateSprintInput = z.infer<typeof createSprintSchema>;
export type CreateSubTaskInput = z.infer<typeof createSubTaskSchema>;
export type WorkLogInput = z.infer<typeof workLogSchema>;
export type KnowledgeBaseInput = z.infer<typeof knowledgeBaseSchema>;
