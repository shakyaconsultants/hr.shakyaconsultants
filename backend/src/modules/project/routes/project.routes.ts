import { Router } from 'express';
import { authenticateMiddleware } from '@modules/auth/middleware/authenticate.middleware.js';
import { companyScopeMiddleware } from '@modules/auth/middleware/company-scope.middleware.js';
import { authorize } from '@modules/rbac/middleware/authorize.middleware.js';
import { uploadMiddleware } from '@config/upload.config.js';
import { PROJECT_PERMISSIONS } from '@modules/project/constants/project-permissions.constants.js';
import {
  addTaskComment,
  addWorkLogComment,
  approveVerification,
  archiveProject,
  assignMember,
  bulkUpdateTaskStatus,
  createMilestone,
  createModule,
  createProject,
  createSprint,
  createSubTask,
  createTask,
  createWorkLog,
  deleteMilestone,
  deleteModule,
  deleteProject,
  deleteTask,
  getDeveloperDashboard,
  getKnowledgeBase,
  getManagerDashboard,
  getProject,
  getProjectDashboard,
  getSprintBurndown,
  getTask,
  getTaskKanban,
  listMembers,
  listMilestones,
  listModules,
  listProjects,
  listSprints,
  listSubTasks,
  listTaskAssignments,
  listTaskComments,
  listTaskVerifications,
  listTasks,
  listWorkflowStages,
  listWorkLogs,
  rejectVerification,
  removeMember,
  restoreProject,
  submitVerification,
  updateProject,
  updateSprint,
  updateTask,
  uploadProjectLogo,
  uploadTaskAttachment,
  upsertKnowledgeBase,
} from '@modules/project/controllers/project.controller.js';

const projectRoutes = Router();

projectRoutes.use(authenticateMiddleware);
projectRoutes.use(companyScopeMiddleware());

/** @swagger tags: [Projects] */
projectRoutes.get('/dashboard/manager', authorize(PROJECT_PERMISSIONS.DASHBOARD_READ), getManagerDashboard);
projectRoutes.get('/dashboard/developer', authorize(PROJECT_PERMISSIONS.DASHBOARD_READ), getDeveloperDashboard);
projectRoutes.get('/dashboard/:projectId', authorize(PROJECT_PERMISSIONS.DASHBOARD_READ), getProjectDashboard);
projectRoutes.get('/workflow/stages', authorize(PROJECT_PERMISSIONS.TASK_READ), listWorkflowStages);

projectRoutes.get('/tasks/list', authorize(PROJECT_PERMISSIONS.TASK_READ), listTasks);
projectRoutes.post('/tasks', authorize(PROJECT_PERMISSIONS.TASK_CREATE), createTask);
projectRoutes.post('/tasks/bulk-status', authorize(PROJECT_PERMISSIONS.TASK_UPDATE), bulkUpdateTaskStatus);
projectRoutes.get('/tasks/:id', authorize(PROJECT_PERMISSIONS.TASK_READ), getTask);
projectRoutes.patch('/tasks/:id', authorize(PROJECT_PERMISSIONS.TASK_UPDATE), updateTask);
projectRoutes.delete('/tasks/:id', authorize(PROJECT_PERMISSIONS.TASK_DELETE), deleteTask);
projectRoutes.get('/tasks/:id/comments', authorize(PROJECT_PERMISSIONS.TASK_READ), listTaskComments);
projectRoutes.post('/tasks/:id/comments', authorize(PROJECT_PERMISSIONS.TASK_UPDATE), addTaskComment);
projectRoutes.post('/tasks/:id/attachments', authorize(PROJECT_PERMISSIONS.TASK_UPDATE), uploadMiddleware.single('file'), uploadTaskAttachment);
projectRoutes.get('/tasks/:id/assignments', authorize(PROJECT_PERMISSIONS.TASK_READ), listTaskAssignments);
projectRoutes.post('/tasks/:id/verify', authorize(PROJECT_PERMISSIONS.VERIFICATION_EXECUTE), submitVerification);
projectRoutes.get('/tasks/:id/verifications', authorize(PROJECT_PERMISSIONS.VERIFICATION_READ), listTaskVerifications);
projectRoutes.get('/tasks/:taskId/subtasks', authorize(PROJECT_PERMISSIONS.TASK_READ), listSubTasks);

projectRoutes.post('/members', authorize(PROJECT_PERMISSIONS.PROJECT_UPDATE), assignMember);
projectRoutes.delete('/members/:id', authorize(PROJECT_PERMISSIONS.PROJECT_UPDATE), removeMember);
projectRoutes.post('/modules', authorize(PROJECT_PERMISSIONS.MODULE_CREATE), createModule);
projectRoutes.delete('/modules/:id', authorize(PROJECT_PERMISSIONS.MODULE_DELETE), deleteModule);
projectRoutes.post('/milestones', authorize(PROJECT_PERMISSIONS.MILESTONE_CREATE), createMilestone);
projectRoutes.delete('/milestones/:id', authorize(PROJECT_PERMISSIONS.MILESTONE_DELETE), deleteMilestone);
projectRoutes.post('/sprints', authorize(PROJECT_PERMISSIONS.SPRINT_CREATE), createSprint);
projectRoutes.patch('/sprints/:id', authorize(PROJECT_PERMISSIONS.SPRINT_UPDATE), updateSprint);
projectRoutes.get('/sprints/:id/burndown', authorize(PROJECT_PERMISSIONS.SPRINT_READ), getSprintBurndown);
projectRoutes.post('/work-logs', authorize(PROJECT_PERMISSIONS.WORKLOG_MANAGE), createWorkLog);
projectRoutes.post('/work-logs/:id/comment', authorize(PROJECT_PERMISSIONS.WORKLOG_MANAGE), addWorkLogComment);
projectRoutes.post('/subtasks', authorize(PROJECT_PERMISSIONS.TASK_CREATE), createSubTask);
projectRoutes.post('/verifications/:id/approve', authorize(PROJECT_PERMISSIONS.VERIFICATION_EXECUTE), approveVerification);
projectRoutes.post('/verifications/:id/reject', authorize(PROJECT_PERMISSIONS.VERIFICATION_EXECUTE), rejectVerification);

projectRoutes.get('/', authorize(PROJECT_PERMISSIONS.PROJECT_READ), listProjects);
projectRoutes.post('/', authorize(PROJECT_PERMISSIONS.PROJECT_CREATE), createProject);

projectRoutes.get('/:projectId/members', authorize(PROJECT_PERMISSIONS.PROJECT_READ), listMembers);
projectRoutes.get('/:projectId/modules', authorize(PROJECT_PERMISSIONS.MODULE_READ), listModules);
projectRoutes.get('/:projectId/milestones', authorize(PROJECT_PERMISSIONS.MILESTONE_READ), listMilestones);
projectRoutes.get('/:projectId/sprints', authorize(PROJECT_PERMISSIONS.SPRINT_READ), listSprints);
projectRoutes.get('/:projectId/knowledge-base', authorize(PROJECT_PERMISSIONS.KNOWLEDGE_READ), getKnowledgeBase);
projectRoutes.put('/:projectId/knowledge-base', authorize(PROJECT_PERMISSIONS.KNOWLEDGE_MANAGE), upsertKnowledgeBase);
projectRoutes.get('/:projectId/work-logs', authorize(PROJECT_PERMISSIONS.WORKLOG_READ), listWorkLogs);
projectRoutes.get('/:projectId/kanban', authorize(PROJECT_PERMISSIONS.TASK_READ), getTaskKanban);

projectRoutes.get('/:id', authorize(PROJECT_PERMISSIONS.PROJECT_READ), getProject);
projectRoutes.patch('/:id', authorize(PROJECT_PERMISSIONS.PROJECT_UPDATE), updateProject);
projectRoutes.post('/:id/archive', authorize(PROJECT_PERMISSIONS.PROJECT_UPDATE), archiveProject);
projectRoutes.post('/:id/restore', authorize(PROJECT_PERMISSIONS.PROJECT_UPDATE), restoreProject);
projectRoutes.delete('/:id', authorize(PROJECT_PERMISSIONS.PROJECT_DELETE), deleteProject);
projectRoutes.post('/:id/logo', authorize(PROJECT_PERMISSIONS.PROJECT_UPDATE), uploadMiddleware.single('file'), uploadProjectLogo);

export { projectRoutes };
