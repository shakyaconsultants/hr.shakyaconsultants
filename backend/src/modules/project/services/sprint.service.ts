import { SprintRepository, SPRINT_STATUS } from '@domain/project/project.schemas.js';
import { TaskRepository } from '@domain/project/project.schemas.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { ProjectAuditService } from '@modules/project/services/project-audit.service.js';
import { ProjectValidationService } from '@modules/project/services/project-validation.service.js';
import { ProjectEventService } from '@modules/project/services/project-event.service.js';
import { ProjectActivityService } from '@modules/project/services/project-activity.service.js';
import { PROJECT_EVENT } from '@modules/project/services/project-event.service.js';
import type { CreateSprintInput } from '@modules/project/validators/project.validator.js';
import type { ProjectActorContext } from '@modules/project/types/project.types.js';

const COMPLETED_STATUSES = new Set<string>(['completed', 'verified', 'closed']);

export const SprintService = {
  async list(companyId: string, projectId: string) {
    const sprints = await SprintRepository.findMany({ projectId }, { companyId });
    return sprints.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  },

  async create(context: ProjectActorContext, payload: CreateSprintInput) {
    await ProjectValidationService.assertValidSprintDates(
      context.companyId,
      payload.projectId,
      payload.startDate,
      payload.endDate,
    );

    const id = generateUuid();
    const sprint = await SprintRepository.create(
      {
        id,
        companyId: context.companyId,
        projectId: payload.projectId,
        name: payload.name,
        goal: payload.goal,
        startDate: payload.startDate,
        endDate: payload.endDate,
        status: payload.status ?? SPRINT_STATUS.PLANNED,
        capacityHours: payload.capacityHours,
        velocity: 0,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await ProjectAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'sprint',
      entityId: id,
      action: 'create',
      after: ProjectAuditService.toRecord(sprint),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return sprint;
  },

  async update(context: ProjectActorContext, id: string, payload: Partial<CreateSprintInput>) {
    const before = await SprintRepository.findById(id, { companyId: context.companyId });
    if (!before) {
      throw new NotFoundError('Sprint not found', ERROR_CODES.NOT_FOUND);
    }

    if (payload.startDate && payload.endDate) {
      await ProjectValidationService.assertValidSprintDates(
        context.companyId,
        before.projectId,
        payload.startDate,
        payload.endDate,
        id,
      );
    }

    const updated = await SprintRepository.update(id, { ...payload, updatedBy: context.userId }, { companyId: context.companyId });
    if (!updated) {
      throw new NotFoundError('Sprint not found', ERROR_CODES.NOT_FOUND);
    }

    if (payload.status === SPRINT_STATUS.ACTIVE && before.status !== SPRINT_STATUS.ACTIVE) {
      await ProjectEventService.emit(context, {
        activityType: ProjectActivityService.TYPES.SPRINT_STARTED,
        activityDescription: `Sprint "${updated.name}" started`,
        entityType: 'sprint',
        entityId: id,
        notification: {
          userId: context.userId,
          title: 'Sprint Started',
          message: `Sprint "${updated.name}" is now active`,
          entityType: 'sprint',
          entityId: id,
          jobName: PROJECT_EVENT.SPRINT_STARTED,
        },
      });
    }

    await ProjectAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'sprint',
      entityId: id,
      action: 'update',
      before: ProjectAuditService.toRecord(before),
      after: ProjectAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },

  async calculateVelocity(companyId: string, sprintId: string) {
    const tasks = await TaskRepository.findMany({ sprintId }, { companyId });
    const completed = tasks.filter((t) => COMPLETED_STATUSES.has(t.status));
    const velocity = completed.reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);
    await SprintRepository.update(sprintId, { velocity, updatedBy: 'system' }, { companyId });
    return velocity;
  },

  async getBurndownData(companyId: string, sprintId: string) {
    const sprint = await SprintRepository.findById(sprintId, { companyId });
    if (!sprint) {
      throw new NotFoundError('Sprint not found', ERROR_CODES.NOT_FOUND);
    }

    const tasks = await TaskRepository.findMany({ sprintId }, { companyId });
    const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);
    const completedPoints = tasks
      .filter((t) => COMPLETED_STATUSES.has(t.status))
      .reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);

    return {
      sprint,
      totalPoints,
      completedPoints,
      remainingPoints: totalPoints - completedPoints,
      taskCount: tasks.length,
      completedTaskCount: tasks.filter((t) => COMPLETED_STATUSES.has(t.status)).length,
    };
  },

  async softDelete(context: ProjectActorContext, id: string) {
    const before = await SprintRepository.findById(id, { companyId: context.companyId });
    if (!before) {
      throw new NotFoundError('Sprint not found', ERROR_CODES.NOT_FOUND);
    }
    await SprintRepository.softDelete(id, context.userId, { companyId: context.companyId });

    await ProjectAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'sprint',
      entityId: id,
      action: 'delete',
      before: ProjectAuditService.toRecord(before),
      ip: context.ip,
      userAgent: context.userAgent,
    });
  },
};
