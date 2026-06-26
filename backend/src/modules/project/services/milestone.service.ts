import { MilestoneRepository, MILESTONE_STATUS } from '@domain/project/project.schemas.js';
import { TaskRepository } from '@domain/project/project.schemas.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { ProjectAuditService } from '@modules/project/services/project-audit.service.js';
import { ProjectEventService } from '@modules/project/services/project-event.service.js';
import { ProjectActivityService } from '@modules/project/services/project-activity.service.js';
import { PROJECT_EVENT } from '@modules/project/services/project-event.service.js';
import type { CreateMilestoneInput } from '@modules/project/validators/project.validator.js';
import type { ProjectActorContext } from '@modules/project/types/project.types.js';

export const MilestoneService = {
  async list(companyId: string, projectId: string) {
    const milestones = await MilestoneRepository.findMany({ projectId }, { companyId });
    return milestones.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  },

  async create(context: ProjectActorContext, payload: CreateMilestoneInput) {
    const id = generateUuid();
    const milestone = await MilestoneRepository.create(
      {
        id,
        companyId: context.companyId,
        projectId: payload.projectId,
        name: payload.name,
        description: payload.description,
        dueDate: payload.dueDate,
        status: MILESTONE_STATUS.PENDING,
        completionPercent: 0,
        dependencyMilestoneIds: payload.dependencyMilestoneIds ?? [],
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await ProjectAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'milestone',
      entityId: id,
      action: 'create',
      after: ProjectAuditService.toRecord(milestone),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return milestone;
  },

  async update(context: ProjectActorContext, id: string, payload: Record<string, unknown>) {
    const before = await MilestoneRepository.findById(id, { companyId: context.companyId });
    if (!before) {
      throw new NotFoundError('Milestone not found', ERROR_CODES.NOT_FOUND);
    }

    const updated = await MilestoneRepository.update(id, { ...payload, updatedBy: context.userId }, { companyId: context.companyId });
    if (!updated) {
      throw new NotFoundError('Milestone not found', ERROR_CODES.NOT_FOUND);
    }

    if (updated.completionPercent >= 100 && before.status !== MILESTONE_STATUS.COMPLETED) {
      await MilestoneRepository.update(
        id,
        { status: MILESTONE_STATUS.COMPLETED, completedAt: new Date(), updatedBy: context.userId },
        { companyId: context.companyId },
      );

      await ProjectEventService.emit(context, {
        activityType: ProjectActivityService.TYPES.MILESTONE_COMPLETED,
        activityDescription: `Milestone "${updated.name}" completed`,
        entityType: 'milestone',
        entityId: id,
        notification: {
          userId: context.userId,
          title: 'Milestone Completed',
          message: `Milestone "${updated.name}" has been completed`,
          entityType: 'milestone',
          entityId: id,
          jobName: PROJECT_EVENT.MILESTONE_COMPLETED,
        },
      });
    }

    await ProjectAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'milestone',
      entityId: id,
      action: 'update',
      before: ProjectAuditService.toRecord(before),
      after: ProjectAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },

  async recalculateProgress(companyId: string, milestoneId: string) {
    const milestone = await MilestoneRepository.findById(milestoneId, { companyId });
    if (!milestone) {
      return;
    }

    const tasks = await TaskRepository.findMany({ milestoneId }, { companyId });
    if (tasks.length === 0) {
      return;
    }

    const avgProgress = Math.round(
      tasks.reduce((sum, t) => sum + t.progressPercent, 0) / tasks.length,
    );

    await MilestoneRepository.update(
      milestoneId,
      { completionPercent: avgProgress, updatedBy: 'system' },
      { companyId },
    );
  },

  async softDelete(context: ProjectActorContext, id: string) {
    const before = await MilestoneRepository.findById(id, { companyId: context.companyId });
    if (!before) {
      throw new NotFoundError('Milestone not found', ERROR_CODES.NOT_FOUND);
    }
    await MilestoneRepository.softDelete(id, context.userId, { companyId: context.companyId });

    await ProjectAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'milestone',
      entityId: id,
      action: 'delete',
      before: ProjectAuditService.toRecord(before),
      ip: context.ip,
      userAgent: context.userAgent,
    });
  },
};
