import type { TaskDocument } from '@domain/project/project.schemas.js';
import { TaskRepository } from '@domain/project/project.schemas.js';
import { PROJECT_TASK_STATUS } from '@domain/project/project-extended.schemas.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { UploadService } from '@infrastructure/storage/cloudinary.service.js';
import { TaskAttachmentRepository } from '@domain/project/project.schemas.js';
import { TaskCommentRepository } from '@domain/project/project.schemas.js';
import { ProjectAuditService } from '@modules/project/services/project-audit.service.js';
import { ProjectValidationService } from '@modules/project/services/project-validation.service.js';
import { TaskAssignmentService } from '@modules/project/services/task-assignment.service.js';
import { ProjectEventService, PROJECT_EVENT } from '@modules/project/services/project-event.service.js';
import { ProjectActivityService } from '@modules/project/services/project-activity.service.js';
import { resolveNotificationUserId } from '@modules/project/utils/project-notification.util.js';
import { buildSearchFilter } from '@infrastructure/database/query/search.helper.js';
import { mergeFilters } from '@infrastructure/database/query/filtering.helper.js';
import type { CreateTaskInput, UpdateTaskInput } from '@modules/project/validators/project.validator.js';
import type { ProjectActorContext, TaskListQuery } from '@modules/project/types/project.types.js';

export const TaskService = {
  async getById(companyId: string, id: string): Promise<TaskDocument> {
    const task = await TaskRepository.findById(id, { companyId });
    if (!task) {
      throw new NotFoundError('Task not found', ERROR_CODES.NOT_FOUND);
    }
    return task;
  },

  async list(companyId: string, query: TaskListQuery) {
    const filters: Record<string, unknown>[] = [];
    if (query.projectId) {
      filters.push({ projectId: query.projectId });
    }
    if (query.sprintId) {
      filters.push({ sprintId: query.sprintId });
    }
    if (query.moduleId) {
      filters.push({ moduleId: query.moduleId });
    }
    if (query.milestoneId) {
      filters.push({ milestoneId: query.milestoneId });
    }
    if (query.assigneeId) {
      filters.push({ assigneeId: query.assigneeId });
    }
    if (query.status) {
      filters.push({ status: query.status });
    }
    if (query.priority) {
      filters.push({ priority: query.priority });
    }
    if (query.search) {
      filters.push(buildSearchFilter(query.search, ['title', 'description']));
    }
    const filter = mergeFilters(...filters);

    return TaskRepository.paginate(filter, {
      page: query.page,
      pageSize: query.pageSize,
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: query.sortOrder ?? 'desc',
    }, { companyId });
  },

  async create(context: ProjectActorContext, payload: CreateTaskInput): Promise<TaskDocument> {
    const dependencyTaskIds = payload.dependencyTaskIds ?? [];
    if (payload.dueDate) {
      ProjectValidationService.assertDueDateNotPast(payload.dueDate);
    }

    const id = generateUuid();
    if (dependencyTaskIds.length > 0) {
      await ProjectValidationService.assertNoCircularTaskDependency(context.companyId, id, dependencyTaskIds);
    }

    const reporterId = payload.reporterId ?? context.employeeId ?? context.userId;
    const task = await TaskRepository.create(
      {
        id,
        companyId: context.companyId,
        projectId: payload.projectId,
        moduleId: payload.moduleId,
        milestoneId: payload.milestoneId,
        sprintId: payload.sprintId,
        parentTaskId: payload.parentTaskId,
        title: payload.title,
        description: payload.description,
        status: payload.status ?? PROJECT_TASK_STATUS.BACKLOG,
        priority: payload.priority ?? 'medium',
        taskType: payload.taskType ?? 'feature',
        assigneeId: payload.assigneeId,
        reporterId,
        verifierId: payload.verifierId,
        dueDate: payload.dueDate,
        storyPoints: payload.storyPoints,
        estimatedHours: payload.estimatedHours,
        actualHours: 0,
        labels: payload.labels ?? [],
        dependencyTaskIds,
        blockedReason: payload.blockedReason,
        riskLevel: payload.riskLevel,
        isRecurring: payload.isRecurring ?? false,
        checklist: [],
        progressPercent: 0,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    if (task.assigneeId) {
      await TaskAssignmentService.recordAssignment(context, {
        taskId: id,
        projectId: task.projectId,
        assignedTo: task.assigneeId,
        reason: 'Initial assignment',
      });

      const recipientUserId = await resolveNotificationUserId(context.companyId, task.assigneeId);
      await ProjectEventService.emit(context, {
        activityType: ProjectActivityService.TYPES.TASK_ASSIGNED,
        activityDescription: `Task "${task.title}" assigned`,
        entityType: 'task',
        entityId: id,
        metadata: { assigneeId: task.assigneeId },
        notification: {
          userId: recipientUserId,
          title: 'Task Assigned',
          message: `You have been assigned: ${task.title}${task.dueDate ? ` (due ${task.dueDate.toLocaleDateString()})` : ''}`,
          entityType: 'task',
          entityId: id,
          jobName: PROJECT_EVENT.TASK_ASSIGNED,
        },
      });
    }

    await ProjectAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'task',
      entityId: id,
      action: 'create',
      after: ProjectAuditService.toRecord(task),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return task;
  },

  async update(context: ProjectActorContext, id: string, payload: UpdateTaskInput): Promise<TaskDocument> {
    const before = await this.getById(context.companyId, id);

    if (payload.dependencyTaskIds) {
      await ProjectValidationService.assertNoCircularTaskDependency(context.companyId, id, payload.dependencyTaskIds);
    }

    if (payload.dueDate) {
      ProjectValidationService.assertDueDateNotPast(payload.dueDate);
    }

    const previousAssignee = before.assigneeId;
    const updated = await TaskRepository.update(id, { ...payload, updatedBy: context.userId }, { companyId: context.companyId });
    if (!updated) {
      throw new NotFoundError('Task not found', ERROR_CODES.NOT_FOUND);
    }

    if (payload.assigneeId && payload.assigneeId !== previousAssignee) {
      await TaskAssignmentService.recordAssignment(context, {
        taskId: id,
        projectId: updated.projectId,
        assignedTo: payload.assigneeId,
        previousAssigneeId: previousAssignee,
        reason: payload.assignmentReason,
        isReassignment: Boolean(previousAssignee),
      });

      const recipientUserId = await resolveNotificationUserId(context.companyId, payload.assigneeId);
      await ProjectEventService.emit(context, {
        activityType: ProjectActivityService.TYPES.TASK_ASSIGNED,
        activityDescription: `Task "${updated.title}" assigned`,
        entityType: 'task',
        entityId: id,
        metadata: { assigneeId: payload.assigneeId },
        notification: {
          userId: recipientUserId,
          title: 'Task Assigned',
          message: `You have been assigned: ${updated.title}${updated.dueDate ? ` (due ${updated.dueDate.toLocaleDateString()})` : ''}`,
          entityType: 'task',
          entityId: id,
          jobName: PROJECT_EVENT.TASK_ASSIGNED,
        },
      });
    }

    if (payload.status === PROJECT_TASK_STATUS.COMPLETED && before.status !== PROJECT_TASK_STATUS.COMPLETED) {
      let verifierNotification;
      if (updated.verifierId) {
        const verifierUserId = await resolveNotificationUserId(context.companyId, updated.verifierId);
        verifierNotification = {
          userId: verifierUserId,
          title: 'Task Ready for Verification',
          message: `Task "${updated.title}" is ready for verification`,
          entityType: 'task',
          entityId: id,
          jobName: PROJECT_EVENT.TASK_COMPLETED,
        };

        const { TaskVerificationService } = await import('@modules/project/services/task-verification.service.js');
        await TaskVerificationService.submit(context, id, updated.verifierId);
      }
      await ProjectEventService.emit(context, {
        activityType: ProjectActivityService.TYPES.TASK_COMPLETED,
        activityDescription: `Task "${updated.title}" marked completed`,
        entityType: 'task',
        entityId: id,
        notification: verifierNotification,
      });
    }

    await ProjectAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'task',
      entityId: id,
      action: 'update',
      before: ProjectAuditService.toRecord(before),
      after: ProjectAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },

  async softDelete(context: ProjectActorContext, id: string): Promise<void> {
    const before = await this.getById(context.companyId, id);
    await TaskRepository.softDelete(id, context.userId, { companyId: context.companyId });

    await ProjectAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'task',
      entityId: id,
      action: 'delete',
      before: ProjectAuditService.toRecord(before),
      ip: context.ip,
      userAgent: context.userAgent,
    });
  },

  async getKanban(companyId: string, projectId: string) {
    const tasks = await TaskRepository.findMany({ projectId }, { companyId });
    const columns: Record<string, TaskDocument[]> = {};
    for (const status of Object.values(PROJECT_TASK_STATUS)) {
      columns[status] = tasks.filter((t) => t.status === status);
    }
    return { columns, total: tasks.length };
  },

  async addComment(context: ProjectActorContext, taskId: string, content: string) {
    await this.getById(context.companyId, taskId);
    const id = generateUuid();
    return TaskCommentRepository.create(
      {
        id,
        companyId: context.companyId,
        taskId,
        authorId: context.userId,
        content,
        isEdited: false,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );
  },

  async listComments(companyId: string, taskId: string) {
    const comments = await TaskCommentRepository.findMany({ taskId }, { companyId });
    return comments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async uploadAttachment(context: ProjectActorContext, taskId: string, file: Express.Multer.File) {
    await this.getById(context.companyId, taskId);
    const upload = await UploadService.uploadDocument({
      buffer: file.buffer,
      folder: `projects/tasks/${taskId}`,
      filename: file.originalname,
      mimeType: file.mimetype,
    });

    const id = generateUuid();
    const attachment = await TaskAttachmentRepository.create(
      {
        id,
        companyId: context.companyId,
        taskId,
        fileName: file.originalname,
        fileUrl: upload.secureUrl,
        publicId: upload.publicId,
        mimeType: file.mimetype,
        fileSize: file.size,
        uploadedBy: context.userId,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await ProjectAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'task_attachment',
      entityId: id,
      action: 'upload',
      after: ProjectAuditService.toRecord(attachment),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return attachment;
  },

  async bulkUpdateStatus(context: ProjectActorContext, taskIds: string[], status: string) {
    const results = [];
    for (const taskId of taskIds) {
      const updated = await this.update(context, taskId, { status });
      results.push(updated);
    }
    return results;
  },
};
