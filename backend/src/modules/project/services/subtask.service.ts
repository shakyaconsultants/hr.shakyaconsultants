import { SubTaskRepository } from '@domain/project/project.schemas.js';
import { PROJECT_TASK_STATUS } from '@domain/project/project-extended.schemas.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { TaskRepository } from '@domain/project/project.schemas.js';
import { ProjectAuditService } from '@modules/project/services/project-audit.service.js';
import type { CreateSubTaskInput } from '@modules/project/validators/project.validator.js';
import type { ProjectActorContext } from '@modules/project/types/project.types.js';

export const SubTaskService = {
  async list(companyId: string, taskId: string, parentSubTaskId?: string) {
    const filter: Record<string, unknown> = { taskId };
    if (parentSubTaskId) {
      filter.parentSubTaskId = parentSubTaskId;
    } else {
      filter.parentSubTaskId = { $exists: false };
    }
    const subtasks = await SubTaskRepository.findMany(filter, { companyId });
    return subtasks.sort((a, b) => a.sortOrder - b.sortOrder);
  },

  async create(context: ProjectActorContext, payload: CreateSubTaskInput) {
    const id = generateUuid();
    const subtask = await SubTaskRepository.create(
      {
        id,
        companyId: context.companyId,
        taskId: payload.taskId,
        parentSubTaskId: payload.parentSubTaskId,
        title: payload.title,
        status: PROJECT_TASK_STATUS.TODO,
        assigneeId: payload.assigneeId,
        isCompleted: false,
        sortOrder: payload.sortOrder ?? 0,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await this.recalculateTaskProgress(context.companyId, payload.taskId);

    await ProjectAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'subtask',
      entityId: id,
      action: 'create',
      after: ProjectAuditService.toRecord(subtask),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return subtask;
  },

  async update(context: ProjectActorContext, id: string, payload: Record<string, unknown>) {
    const before = await SubTaskRepository.findById(id, { companyId: context.companyId });
    if (!before) {
      throw new NotFoundError('Subtask not found', ERROR_CODES.NOT_FOUND);
    }

    const updated = await SubTaskRepository.update(id, { ...payload, updatedBy: context.userId }, { companyId: context.companyId });
    if (!updated) {
      throw new NotFoundError('Subtask not found', ERROR_CODES.NOT_FOUND);
    }

    await this.recalculateTaskProgress(context.companyId, before.taskId);

    await ProjectAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'subtask',
      entityId: id,
      action: 'update',
      before: ProjectAuditService.toRecord(before),
      after: ProjectAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },

  async recalculateTaskProgress(companyId: string, taskId: string) {
    const subtasks = await SubTaskRepository.findMany({ taskId }, { companyId });
    if (subtasks.length === 0) {
      return;
    }
    const completed = subtasks.filter((s) => s.isCompleted).length;
    const progressPercent = Math.round((completed / subtasks.length) * 100);
    await TaskRepository.update(taskId, { progressPercent, updatedBy: 'system' }, { companyId });
  },

  async softDelete(context: ProjectActorContext, id: string) {
    const before = await SubTaskRepository.findById(id, { companyId: context.companyId });
    if (!before) {
      throw new NotFoundError('Subtask not found', ERROR_CODES.NOT_FOUND);
    }
    await SubTaskRepository.softDelete(id, context.userId, { companyId: context.companyId });
    await this.recalculateTaskProgress(context.companyId, before.taskId);
  },
};
