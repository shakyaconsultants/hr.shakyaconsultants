import { ReportingHierarchyRepository } from '@domain/employee/employee.schemas.js';
import { REPORTING_RELATIONSHIP_TYPE } from '@domain/employee/employee.schemas.js';
import type { ReportingHierarchyDocument } from '@domain/employee/employee.schemas.js';
import { NotFoundError, ConflictError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import type { RbacActorContext } from '@modules/rbac/types/rbac.types.js';
import { RbacAuditService } from '@modules/rbac/services/rbac-audit.service.js';

export const ReportingHierarchyService = {
  async listForEmployee(companyId: string, employeeId: string): Promise<ReportingHierarchyDocument[]> {
    return ReportingHierarchyRepository.findMany(
      { employeeId, $or: [{ effectiveTo: null }, { effectiveTo: { $exists: false } }] },
      { companyId },
    );
  },

  async assign(
    companyId: string,
    payload: {
      employeeId: string;
      managerId: string;
      relationshipType: string;
      isPrimary?: boolean;
      effectiveFrom?: Date;
    },
    actor: RbacActorContext,
  ): Promise<ReportingHierarchyDocument> {
    if (payload.employeeId === payload.managerId) {
      throw new ConflictError('Employee cannot report to themselves', ERROR_CODES.CONFLICT);
    }

    const validTypes = Object.values(REPORTING_RELATIONSHIP_TYPE);
    if (!validTypes.includes(payload.relationshipType as typeof REPORTING_RELATIONSHIP_TYPE.DIRECT)) {
      throw new ConflictError('Invalid relationship type', ERROR_CODES.CONFLICT);
    }

    const circular = await ReportingHierarchyRepository.findOne(
      { employeeId: payload.managerId, managerId: payload.employeeId, effectiveTo: { $exists: false } },
      { companyId },
    );
    if (circular) {
      throw new ConflictError('Circular reporting hierarchy detected', ERROR_CODES.CONFLICT);
    }

    const id = generateUuid();
    const entry = await ReportingHierarchyRepository.create(
      {
        id,
        companyId,
        employeeId: payload.employeeId,
        managerId: payload.managerId,
        relationshipType: payload.relationshipType,
        isPrimary: payload.isPrimary ?? payload.relationshipType === REPORTING_RELATIONSHIP_TYPE.DIRECT,
        effectiveFrom: payload.effectiveFrom ?? new Date(),
        createdBy: actor.userId,
        updatedBy: actor.userId,
      },
      { companyId },
    );

    await RbacAuditService.log({
      companyId,
      userId: actor.userId,
      entityType: 'reporting_hierarchy',
      entityId: id,
      action: 'assign',
      after: { ...payload },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    return entry;
  },

  async endAssignment(
    companyId: string,
    id: string,
    actor: RbacActorContext,
  ): Promise<void> {
    const entry = await ReportingHierarchyRepository.findById(id, { companyId });
    if (!entry) {
      throw new NotFoundError('Reporting hierarchy entry not found', ERROR_CODES.NOT_FOUND);
    }

    await ReportingHierarchyRepository.update(
      id,
      { $set: { effectiveTo: new Date(), updatedBy: actor.userId } },
      { companyId },
    );

    await RbacAuditService.log({
      companyId,
      userId: actor.userId,
      entityType: 'reporting_hierarchy',
      entityId: id,
      action: 'revoke',
      before: { employeeId: entry.employeeId, managerId: entry.managerId },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });
  },
};
