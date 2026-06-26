import type { ProjectMemberDocument } from '@domain/project/project.schemas.js';
import { ProjectMemberRepository } from '@domain/project/project.schemas.js';
import { ProjectMemberHistoryRepository } from '@domain/project/project-extended.schemas.js';
import { NotFoundError, ConflictError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { ProjectAuditService } from '@modules/project/services/project-audit.service.js';
import { ProjectEventService } from '@modules/project/services/project-event.service.js';
import { ProjectActivityService } from '@modules/project/services/project-activity.service.js';
import type { CreateMemberInput, BulkAssignMembersInput, UpdateMemberInput } from '@modules/project/validators/project.validator.js';
import type { ProjectActorContext } from '@modules/project/types/project.types.js';

const MEMBER_HISTORY_ACTION = {
  ASSIGNED: 'assigned',
  UPDATED: 'updated',
  REMOVED: 'removed',
} as const;

async function recordMemberHistory(
  context: ProjectActorContext,
  input: {
    projectId: string;
    employeeId: string;
    action: string;
    role: string;
    previousRole?: string;
    allocationPercent?: number;
    notes?: string;
  },
) {
  await ProjectMemberHistoryRepository.create(
    {
      id: generateUuid(),
      companyId: context.companyId,
      projectId: input.projectId,
      employeeId: input.employeeId,
      action: input.action,
      role: input.role,
      previousRole: input.previousRole,
      allocationPercent: input.allocationPercent,
      performedBy: context.userId,
      performedAt: new Date(),
      notes: input.notes,
      createdBy: context.userId,
      updatedBy: context.userId,
    },
    { companyId: context.companyId },
  );
}

export const ProjectMemberService = {
  async list(companyId: string, projectId: string) {
    return ProjectMemberRepository.findMany({ projectId }, { companyId });
  },

  async listHistory(companyId: string, projectId: string) {
    const history = await ProjectMemberHistoryRepository.findMany({ projectId }, { companyId });
    return history.sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime());
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

    await recordMemberHistory(context, {
      projectId,
      employeeId,
      action: MEMBER_HISTORY_ACTION.ASSIGNED,
      role: member.role,
      allocationPercent: member.allocationPercent,
    });

    return member;
  },

  async bulkAssign(context: ProjectActorContext, payload: BulkAssignMembersInput) {
    const results: ProjectMemberDocument[] = [];
    for (const member of payload.members) {
      const assigned = await this.assign(context, {
        projectId: payload.projectId,
        employeeId: member.employeeId,
        role: member.role,
        allocationPercent: member.allocationPercent,
      });
      results.push(assigned);
    }
    return results;
  },

  async update(context: ProjectActorContext, id: string, payload: UpdateMemberInput) {
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

    await recordMemberHistory(context, {
      projectId: before.projectId,
      employeeId: before.employeeId,
      action: MEMBER_HISTORY_ACTION.UPDATED,
      role: updated.role,
      previousRole: before.role,
      allocationPercent: updated.allocationPercent,
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

    await recordMemberHistory(context, {
      projectId: before.projectId,
      employeeId: before.employeeId,
      action: MEMBER_HISTORY_ACTION.REMOVED,
      role: before.role,
      allocationPercent: before.allocationPercent,
    });

    return updated;
  },
};
