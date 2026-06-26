import { ApprovalHierarchyLevelRepository } from '@domain/permission/rbac.schemas.js';
import type { ApprovalHierarchyLevelDocument } from '@domain/permission/rbac.schemas.js';
import { NotFoundError, ConflictError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import type { RbacActorContext } from '@modules/rbac/types/rbac.types.js';
import { RbacAuditService } from '@modules/rbac/services/rbac-audit.service.js';

export const ApprovalHierarchyService = {
  async list(companyId: string): Promise<ApprovalHierarchyLevelDocument[]> {
    const levels = await ApprovalHierarchyLevelRepository.findMany({}, { companyId });
    return levels.sort((a, b) => a.level - b.level);
  },

  async upsert(
    companyId: string,
    payload: {
      level: number;
      name: string;
      slug: string;
      roleSlug?: string;
      priority?: number;
    },
    actor: RbacActorContext,
  ): Promise<ApprovalHierarchyLevelDocument> {
    const existing = await ApprovalHierarchyLevelRepository.findOne({ slug: payload.slug }, { companyId });

    if (existing) {
      const updated = await ApprovalHierarchyLevelRepository.update(
        existing.id,
        { $set: { ...payload, updatedBy: actor.userId } },
        { companyId },
      );
      if (!updated) {
        throw new NotFoundError('Approval level not found', ERROR_CODES.NOT_FOUND);
      }
      return updated;
    }

    const levelConflict = await ApprovalHierarchyLevelRepository.findOne({ level: payload.level }, { companyId });
    if (levelConflict) {
      throw new ConflictError('Approval level number already exists', ERROR_CODES.CONFLICT);
    }

    const id = generateUuid();
    const created = await ApprovalHierarchyLevelRepository.create(
      {
        id,
        companyId,
        ...payload,
        priority: payload.priority ?? payload.level * 10,
        status: ENTITY_STATUS.ACTIVE,
        createdBy: actor.userId,
        updatedBy: actor.userId,
      },
      { companyId },
    );

    await RbacAuditService.log({
      companyId,
      userId: actor.userId,
      entityType: 'approval_hierarchy',
      entityId: id,
      action: 'create',
      after: { ...payload },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    return created;
  },
};
