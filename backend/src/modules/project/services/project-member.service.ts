import type { ProjectMemberDocument } from '@domain/project/project.schemas.js';
import { ProjectMemberRepository } from '@domain/project/project.schemas.js';
import { NotFoundError, ConflictError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { ProjectAuditService } from '@modules/project/services/project-audit.service.js';
import { ProjectEventService } from '@modules/project/services/project-event.service.js';
import { ProjectActivityService } from '@modules/project/services/project-activity.service.js';
import type { CreateMemberInput } from '@modules/project/validators/project.validator.js';
import type { ProjectActorContext } from '@modules/project/types/project.types.js';

export const ProjectMemberService = {
  async list(companyId: string, projectId: string) {
    return ProjectMemberRepository.findMany({ projectId }, { companyId });
  },

  async assign(context: ProjectActorContext, payload: CreateMemberInput): Promise<ProjectMemberDocument> {
    const { projectId, employeeId } = payload;

    const existing = await ProjectMemberRepository.findOne({ projectId, employeeId }, { companyId: context.companyId });
    if (existing && !existing.leftAt) {
      throw new ConflictError('Employee is already an active project member', ERROR_CODES.CONFLICT);
    }

    const id = generateUuid();
    const member = await ProjectMemberRepository.create(
      {
        id,
        companyId: context.companyId,
        projectId,
        employeeId,
        role: payload.role,
        joinedAt: payload.joinedAt ?? new Date(),
        allocationPercent: payload.allocationPercent ?? 100,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await ProjectAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'project_member',
      entityId: id,
      action: 'create',
      after: ProjectAuditService.toRecord(member),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    await ProjectEventService.emit(context, {
      activityType: ProjectActivityService.TYPES.MEMBER_ADDED,
      activityDescription: `Member added to project`,
      entityType: 'project',
      entityId: projectId,
      metadata: { employeeId, role: member.role },
    });

    return member;
  },

  async update(context: ProjectActorContext, id: string, payload: Record<string, unknown>) {
    const before = await ProjectMemberRepository.findById(id, { companyId: context.companyId });
    if (!before) {
      throw new NotFoundError('Project member not found', ERROR_CODES.NOT_FOUND);
    }

    const updated = await ProjectMemberRepository.update(id, { ...payload, updatedBy: context.userId }, { companyId: context.companyId });
    if (!updated) {
      throw new NotFoundError('Project member not found', ERROR_CODES.NOT_FOUND);
    }

    await ProjectAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'project_member',
      entityId: id,
      action: 'update',
      before: ProjectAuditService.toRecord(before),
      after: ProjectAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },

  async remove(context: ProjectActorContext, id: string, leftAt?: Date) {
    const before = await ProjectMemberRepository.findById(id, { companyId: context.companyId });
    if (!before) {
      throw new NotFoundError('Project member not found', ERROR_CODES.NOT_FOUND);
    }

    const updated = await ProjectMemberRepository.update(
      id,
      { leftAt: leftAt ?? new Date(), updatedBy: context.userId },
      { companyId: context.companyId },
    );

    await ProjectAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'project_member',
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
