import { DailyWorkLogRepository } from '@domain/project/project-extended.schemas.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { ProjectAuditService } from '@modules/project/services/project-audit.service.js';
import type { WorkLogInput } from '@modules/project/validators/project.validator.js';
import type { ProjectActorContext } from '@modules/project/types/project.types.js';

export const WorkLogService = {
  async list(companyId: string, filters: { projectId?: string; employeeId?: string; from?: Date; to?: Date }) {
    const query: Record<string, unknown> = {};
    if (filters.projectId) {
      query.projectId = filters.projectId;
    }
    if (filters.employeeId) {
      query.employeeId = filters.employeeId;
    }
    if (filters.from || filters.to) {
      query.workDate = {};
      if (filters.from) {
        (query.workDate as Record<string, Date>).$gte = filters.from;
      }
      if (filters.to) {
        (query.workDate as Record<string, Date>).$lte = filters.to;
      }
    }
    const logs = await DailyWorkLogRepository.findMany(query, { companyId });
    return logs.sort((a, b) => b.workDate.getTime() - a.workDate.getTime());
  },

  async create(context: ProjectActorContext, payload: WorkLogInput) {
    const id = generateUuid();
    const employeeId = payload.employeeId ?? context.employeeId ?? context.userId;
    const log = await DailyWorkLogRepository.create(
      {
        id,
        companyId: context.companyId,
        projectId: payload.projectId,
        taskId: payload.taskId,
        employeeId,
        workDate: payload.workDate,
        description: payload.description,
        hours: payload.hours,
        progressPercent: payload.progressPercent,
        blockers: payload.blockers,
        attachmentUrls: payload.attachmentUrls ?? [],
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await ProjectAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'work_log',
      entityId: id,
      action: 'create',
      after: ProjectAuditService.toRecord(log),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return log;
  },

  async addManagerComment(context: ProjectActorContext, id: string, comment: string) {
    const before = await DailyWorkLogRepository.findById(id, { companyId: context.companyId });
    if (!before) {
      throw new NotFoundError('Work log not found', ERROR_CODES.NOT_FOUND);
    }

    const updated = await DailyWorkLogRepository.update(
      id,
      { managerComment: comment, updatedBy: context.userId },
      { companyId: context.companyId },
    );

    await ProjectAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'work_log',
      entityId: id,
      action: 'update',
      before: ProjectAuditService.toRecord(before),
      after: ProjectAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },
};
