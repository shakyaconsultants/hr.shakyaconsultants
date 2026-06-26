import type { RequestHandler } from 'express';
import type { AuthenticatedRequest } from '@modules/auth/interfaces/auth-request.interface.js';
import { ResponseService } from '@shared/services/response.service.js';
import { validateInput } from '@modules/auth/validators/validate.util.js';
import { ProjectService } from '@modules/project/services/project.service.js';
import { TaskService } from '@modules/project/services/task.service.js';
import { ProjectMemberService } from '@modules/project/services/project-member.service.js';
import { ProjectModuleService } from '@modules/project/services/project-module.service.js';
import { MilestoneService } from '@modules/project/services/milestone.service.js';
import { SprintService } from '@modules/project/services/sprint.service.js';
import { SubTaskService } from '@modules/project/services/subtask.service.js';
import { TaskAssignmentService } from '@modules/project/services/task-assignment.service.js';
import { TaskVerificationService } from '@modules/project/services/task-verification.service.js';
import { WorkLogService } from '@modules/project/services/work-log.service.js';
import { KnowledgeBaseService } from '@modules/project/services/knowledge-base.service.js';
import { TaskWorkflowService } from '@modules/project/services/task-workflow.service.js';
import { ProjectDashboardService } from '@modules/project/services/project-dashboard.service.js';
import { ValidationError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import type { ProjectActorContext } from '@modules/project/types/project.types.js';
import {
  bulkTaskStatusSchema,
  createMemberSchema,
  createMilestoneSchema,
  createModuleSchema,
  createProjectSchema,
  createSprintSchema,
  createSubTaskSchema,
  createTaskSchema,
  idParamSchema,
  knowledgeBaseSchema,
  managerCommentSchema,
  projectIdParamSchema,
  projectListQuerySchema,
  taskCommentSchema,
  taskIdParamSchema,
  taskListQuerySchema,
  updateProjectSchema,
  updateTaskSchema,
  verificationDecisionSchema,
  verificationSubmitSchema,
  workLogSchema,
} from '@modules/project/validators/project.validator.js';

function buildActor(req: AuthenticatedRequest): ProjectActorContext {
  return {
    companyId: req.user.companyId,
    userId: req.user.userId,
    employeeId: req.user.employeeId,
    ip: req.ip,
    userAgent: req.get('user-agent') ?? undefined,
  };
}

// Dashboard
export const getManagerDashboard: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const data = await ProjectDashboardService.getManagerDashboard(authReq.user.companyId);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getDeveloperDashboard: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const employeeId = authReq.user.employeeId ?? authReq.user.userId;
    const data = await ProjectDashboardService.getDeveloperDashboard(authReq.user.companyId, employeeId);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getProjectDashboard: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { projectId } = validateInput(projectIdParamSchema, req.params);
    const data = await ProjectDashboardService.getProjectDashboard(authReq.user.companyId, projectId);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

// Projects
export const listProjects: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(projectListQuerySchema, req.query);
    const result = await ProjectService.list(authReq.user.companyId, query);
    return ResponseService.paginated(res, authReq, result);
  } catch (error) {
    next(error);
    return;
  }
};

export const getProject: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const project = await ProjectService.getById(authReq.user.companyId, id);
    return ResponseService.success(res, authReq, project);
  } catch (error) {
    next(error);
    return;
  }
};

export const createProject: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(createProjectSchema, req.body);
    const project = await ProjectService.create(buildActor(authReq), payload);
    return ResponseService.created(res, authReq, project);
  } catch (error) {
    next(error);
    return;
  }
};

export const updateProject: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const payload = validateInput(updateProjectSchema, req.body);
    const project = await ProjectService.update(buildActor(authReq), id, payload);
    return ResponseService.success(res, authReq, project);
  } catch (error) {
    next(error);
    return;
  }
};

export const archiveProject: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const project = await ProjectService.archive(buildActor(authReq), id);
    return ResponseService.success(res, authReq, project);
  } catch (error) {
    next(error);
    return;
  }
};

export const restoreProject: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const project = await ProjectService.restore(buildActor(authReq), id);
    return ResponseService.success(res, authReq, project);
  } catch (error) {
    next(error);
    return;
  }
};

export const deleteProject: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    await ProjectService.softDelete(buildActor(authReq), id);
    return ResponseService.noContent(res);
  } catch (error) {
    next(error);
    return;
  }
};

export const uploadProjectLogo: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    if (!req.file) {
      throw new ValidationError('File is required', [], { code: ERROR_CODES.VALIDATION_FAILED });
    }
    const project = await ProjectService.uploadLogo(buildActor(authReq), id, req.file);
    return ResponseService.success(res, authReq, project);
  } catch (error) {
    next(error);
    return;
  }
};

// Tasks
export const listTasks: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(taskListQuerySchema, req.query);
    const result = await TaskService.list(authReq.user.companyId, query);
    return ResponseService.paginated(res, authReq, result);
  } catch (error) {
    next(error);
    return;
  }
};

export const getTask: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const task = await TaskService.getById(authReq.user.companyId, id);
    return ResponseService.success(res, authReq, task);
  } catch (error) {
    next(error);
    return;
  }
};

export const createTask: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(createTaskSchema, req.body);
    const task = await TaskService.create(buildActor(authReq), payload);
    return ResponseService.created(res, authReq, task);
  } catch (error) {
    next(error);
    return;
  }
};

export const updateTask: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const payload = validateInput(updateTaskSchema, req.body);
    const task = await TaskService.update(buildActor(authReq), id, payload);
    return ResponseService.success(res, authReq, task);
  } catch (error) {
    next(error);
    return;
  }
};

export const deleteTask: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    await TaskService.softDelete(buildActor(authReq), id);
    return ResponseService.noContent(res);
  } catch (error) {
    next(error);
    return;
  }
};

export const getTaskKanban: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { projectId } = validateInput(projectIdParamSchema, req.params);
    const kanban = await TaskService.getKanban(authReq.user.companyId, projectId);
    return ResponseService.success(res, authReq, kanban);
  } catch (error) {
    next(error);
    return;
  }
};

export const bulkUpdateTaskStatus: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { taskIds, status } = validateInput(bulkTaskStatusSchema, req.body);
    const tasks = await TaskService.bulkUpdateStatus(buildActor(authReq), taskIds, status);
    return ResponseService.success(res, authReq, tasks);
  } catch (error) {
    next(error);
    return;
  }
};

export const addTaskComment: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const { content } = validateInput(taskCommentSchema, req.body);
    const comment = await TaskService.addComment(buildActor(authReq), id, content);
    return ResponseService.created(res, authReq, comment);
  } catch (error) {
    next(error);
    return;
  }
};

export const listTaskComments: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const comments = await TaskService.listComments(authReq.user.companyId, id);
    return ResponseService.success(res, authReq, comments);
  } catch (error) {
    next(error);
    return;
  }
};

export const uploadTaskAttachment: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    if (!req.file) {
      throw new ValidationError('File is required', [], { code: ERROR_CODES.VALIDATION_FAILED });
    }
    const attachment = await TaskService.uploadAttachment(buildActor(authReq), id, req.file);
    return ResponseService.created(res, authReq, attachment);
  } catch (error) {
    next(error);
    return;
  }
};

export const listTaskAssignments: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const history = await TaskAssignmentService.listByTask(authReq.user.companyId, id);
    return ResponseService.success(res, authReq, history);
  } catch (error) {
    next(error);
    return;
  }
};

// Verification
export const submitVerification: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const { verifierId } = validateInput(verificationSubmitSchema, req.body);
    const verification = await TaskVerificationService.submit(buildActor(authReq), id, verifierId);
    return ResponseService.created(res, authReq, verification);
  } catch (error) {
    next(error);
    return;
  }
};

export const approveVerification: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const { comment } = validateInput(verificationDecisionSchema, req.body);
    const verification = await TaskVerificationService.approve(buildActor(authReq), id, comment);
    return ResponseService.success(res, authReq, verification);
  } catch (error) {
    next(error);
    return;
  }
};

export const rejectVerification: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const { comment, revisionNotes } = validateInput(verificationDecisionSchema, req.body);
    const verification = await TaskVerificationService.reject(buildActor(authReq), id, comment ?? '', revisionNotes);
    return ResponseService.success(res, authReq, verification);
  } catch (error) {
    next(error);
    return;
  }
};

export const listTaskVerifications: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const verifications = await TaskVerificationService.listByTask(authReq.user.companyId, id);
    return ResponseService.success(res, authReq, verifications);
  } catch (error) {
    next(error);
    return;
  }
};

// Members
export const listMembers: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { projectId } = validateInput(projectIdParamSchema, req.params);
    const members = await ProjectMemberService.list(authReq.user.companyId, projectId);
    return ResponseService.success(res, authReq, members);
  } catch (error) {
    next(error);
    return;
  }
};

export const assignMember: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(createMemberSchema, req.body);
    const member = await ProjectMemberService.assign(buildActor(authReq), payload);
    return ResponseService.created(res, authReq, member);
  } catch (error) {
    next(error);
    return;
  }
};

export const removeMember: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const member = await ProjectMemberService.remove(buildActor(authReq), id);
    return ResponseService.success(res, authReq, member);
  } catch (error) {
    next(error);
    return;
  }
};

// Modules
export const listModules: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { projectId } = validateInput(projectIdParamSchema, req.params);
    const modules = await ProjectModuleService.list(authReq.user.companyId, projectId);
    return ResponseService.success(res, authReq, modules);
  } catch (error) {
    next(error);
    return;
  }
};

export const createModule: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(createModuleSchema, req.body);
    const module = await ProjectModuleService.create(buildActor(authReq), payload);
    return ResponseService.created(res, authReq, module);
  } catch (error) {
    next(error);
    return;
  }
};

export const deleteModule: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    await ProjectModuleService.softDelete(buildActor(authReq), id);
    return ResponseService.noContent(res);
  } catch (error) {
    next(error);
    return;
  }
};

// Milestones
export const listMilestones: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { projectId } = validateInput(projectIdParamSchema, req.params);
    const milestones = await MilestoneService.list(authReq.user.companyId, projectId);
    return ResponseService.success(res, authReq, milestones);
  } catch (error) {
    next(error);
    return;
  }
};

export const createMilestone: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(createMilestoneSchema, req.body);
    const milestone = await MilestoneService.create(buildActor(authReq), payload);
    return ResponseService.created(res, authReq, milestone);
  } catch (error) {
    next(error);
    return;
  }
};

export const deleteMilestone: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    await MilestoneService.softDelete(buildActor(authReq), id);
    return ResponseService.noContent(res);
  } catch (error) {
    next(error);
    return;
  }
};

// Sprints
export const listSprints: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { projectId } = validateInput(projectIdParamSchema, req.params);
    const sprints = await SprintService.list(authReq.user.companyId, projectId);
    return ResponseService.success(res, authReq, sprints);
  } catch (error) {
    next(error);
    return;
  }
};

export const createSprint: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(createSprintSchema, req.body);
    const sprint = await SprintService.create(buildActor(authReq), payload);
    return ResponseService.created(res, authReq, sprint);
  } catch (error) {
    next(error);
    return;
  }
};

export const updateSprint: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const payload = validateInput(createSprintSchema.partial(), req.body);
    const sprint = await SprintService.update(buildActor(authReq), id, payload);
    return ResponseService.success(res, authReq, sprint);
  } catch (error) {
    next(error);
    return;
  }
};

export const getSprintBurndown: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const burndown = await SprintService.getBurndownData(authReq.user.companyId, id);
    return ResponseService.success(res, authReq, burndown);
  } catch (error) {
    next(error);
    return;
  }
};

// Subtasks
export const listSubTasks: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { taskId } = validateInput(taskIdParamSchema, req.params);
    const subtasks = await SubTaskService.list(authReq.user.companyId, taskId);
    return ResponseService.success(res, authReq, subtasks);
  } catch (error) {
    next(error);
    return;
  }
};

export const createSubTask: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(createSubTaskSchema, req.body);
    const subtask = await SubTaskService.create(buildActor(authReq), payload);
    return ResponseService.created(res, authReq, subtask);
  } catch (error) {
    next(error);
    return;
  }
};

// Work logs
export const listWorkLogs: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { projectId } = validateInput(projectIdParamSchema, req.params);
    const logs = await WorkLogService.list(authReq.user.companyId, { projectId });
    return ResponseService.success(res, authReq, logs);
  } catch (error) {
    next(error);
    return;
  }
};

export const createWorkLog: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(workLogSchema, req.body);
    const log = await WorkLogService.create(buildActor(authReq), payload);
    return ResponseService.created(res, authReq, log);
  } catch (error) {
    next(error);
    return;
  }
};

export const addWorkLogComment: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const { comment } = validateInput(managerCommentSchema, req.body);
    const log = await WorkLogService.addManagerComment(buildActor(authReq), id, comment);
    return ResponseService.success(res, authReq, log);
  } catch (error) {
    next(error);
    return;
  }
};

// Knowledge base
export const getKnowledgeBase: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { projectId } = validateInput(projectIdParamSchema, req.params);
    const kb = await KnowledgeBaseService.get(authReq.user.companyId, projectId);
    return ResponseService.success(res, authReq, kb);
  } catch (error) {
    next(error);
    return;
  }
};

export const upsertKnowledgeBase: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { projectId } = validateInput(projectIdParamSchema, req.params);
    const payload = validateInput(knowledgeBaseSchema, req.body);
    const kb = await KnowledgeBaseService.upsert(buildActor(authReq), projectId, payload);
    return ResponseService.success(res, authReq, kb);
  } catch (error) {
    next(error);
    return;
  }
};

export const listWorkflowStages: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : undefined;
    const stages = await TaskWorkflowService.listStages(authReq.user.companyId, projectId);
    return ResponseService.success(res, authReq, stages);
  } catch (error) {
    next(error);
    return;
  }
};
