import type { EmployeeDocument } from '@domain/employee/employee.schemas.js';
import { EmployeeRepository, EMPLOYEE_EMPLOYMENT_STATUS } from '@domain/employee/employee.schemas.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { EmployeeAuditService } from '@modules/employee/services/employee-audit.service.js';
import { EmployeeNumberService } from '@modules/employee/services/employee-number.service.js';
import { EmployeeQueryService } from '@modules/employee/services/employee-query.service.js';
import { EmployeeTimelineService } from '@modules/employee/services/employee-timeline.service.js';
import { EmployeeValidationService } from '@modules/employee/services/employee-validation.service.js';
import { EMPLOYEE_BULK_ACTION } from '@modules/employee/constants/employee.constants.js';
import type { EmployeeActorContext, EmployeeListQuery } from '@modules/employee/types/employee.types.js';

const ENTITY_TYPE = 'employee';

function sanitizeCreatePayload(payload: Record<string, unknown>): Record<string, unknown> {
  const { employeeNumber: _removed, ...rest } = payload;
  return rest;
}

export const EmployeeService = {
  async getById(companyId: string, id: string, includeDeleted = false): Promise<EmployeeDocument> {
    const employee = await EmployeeRepository.findById(id, { companyId, includeDeleted });
    if (!employee) {
      throw new NotFoundError('Employee not found', ERROR_CODES.NOT_FOUND);
    }
    return employee;
  },

  async list(companyId: string, query: EmployeeListQuery) {
    return EmployeeQueryService.list(companyId, query);
  },

  async search(companyId: string, search: string, limit?: number) {
    return EmployeeQueryService.search(companyId, search, limit);
  },

  async create(context: EmployeeActorContext, payload: Record<string, unknown>): Promise<EmployeeDocument> {
    const email = typeof payload.email === 'string' ? payload.email.toLowerCase() : '';
    await EmployeeValidationService.assertUniqueEmail(context.companyId, email);
    await EmployeeValidationService.assertUniqueAadhaar(context.companyId, payload.aadhaarNumber as string | undefined);
    await EmployeeValidationService.assertUniquePan(context.companyId, payload.panNumber as string | undefined);

    if (typeof payload.reportingManagerId === 'string') {
      await EmployeeValidationService.assertManagerExists(context.companyId, payload.reportingManagerId);
    }

    const employeeNumber = await EmployeeNumberService.generate(context.companyId, context.userId);
    const id = generateUuid();
    const sanitized = sanitizeCreatePayload(payload);

    const employee = await EmployeeRepository.create(
      {
        id,
        companyId: context.companyId,
        employeeNumber,
        email,
        languages: [],
        employmentStatus: EMPLOYEE_EMPLOYMENT_STATUS.ACTIVE,
        status: ENTITY_STATUS.ACTIVE,
        ...sanitized,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await EmployeeTimelineService.record(context, {
      employeeId: id,
      eventType: EmployeeTimelineService.EVENT.CREATED,
      title: 'Employee created',
      description: `${employee.firstName} ${employee.lastName} was added to the system`,
    });

    await EmployeeTimelineService.record(context, {
      employeeId: id,
      eventType: EmployeeTimelineService.EVENT.JOINED,
      title: 'Joined organization',
      occurredAt: employee.joinedAt,
      metadata: { employeeNumber },
    });

    await EmployeeAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: ENTITY_TYPE,
      entityId: id,
      action: 'create',
      after: EmployeeAuditService.toRecord(employee),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return employee;
  },

  async update(context: EmployeeActorContext, id: string, payload: Record<string, unknown>): Promise<EmployeeDocument> {
    const before = await this.getById(context.companyId, id);
    const { employeeNumber: _removed, ...updates } = payload;

    if (typeof updates.email === 'string') {
      await EmployeeValidationService.assertUniqueEmail(context.companyId, updates.email, id);
    }
    if (updates.aadhaarNumber !== undefined) {
      await EmployeeValidationService.assertUniqueAadhaar(context.companyId, updates.aadhaarNumber as string | undefined, id);
    }
    if (updates.panNumber !== undefined) {
      await EmployeeValidationService.assertUniquePan(context.companyId, updates.panNumber as string | undefined, id);
    }

    const managerId = updates.reportingManagerId as string | undefined;
    if (managerId !== undefined) {
      await EmployeeValidationService.assertNoManagerLoop(context.companyId, id, managerId);
      if (managerId && managerId !== before.reportingManagerId) {
        await EmployeeValidationService.assertManagerExists(context.companyId, managerId);
      }
    }

    const updated = await EmployeeRepository.update(id, { ...updates, updatedBy: context.userId }, { companyId: context.companyId });
    if (!updated) {
      throw new NotFoundError('Employee not found', ERROR_CODES.NOT_FOUND);
    }

    if (managerId && managerId !== before.reportingManagerId) {
      await EmployeeTimelineService.record(context, {
        employeeId: id,
        eventType: EmployeeTimelineService.EVENT.MANAGER_CHANGE,
        title: 'Reporting manager changed',
        metadata: { from: before.reportingManagerId ?? null, to: managerId },
      });
    }

    if (updates.departmentId && updates.departmentId !== before.departmentId) {
      await EmployeeTimelineService.record(context, {
        employeeId: id,
        eventType: EmployeeTimelineService.EVENT.DEPARTMENT_TRANSFER,
        title: 'Department transfer',
        metadata: { from: before.departmentId, to: updates.departmentId },
      });
    }

    if (updates.designationId && updates.designationId !== before.designationId) {
      await EmployeeTimelineService.record(context, {
        employeeId: id,
        eventType: EmployeeTimelineService.EVENT.PROMOTION,
        title: 'Designation changed',
        metadata: { from: before.designationId, to: updates.designationId },
      });
    }

    await EmployeeAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: ENTITY_TYPE,
      entityId: id,
      action: 'update',
      before: EmployeeAuditService.toRecord(before),
      after: EmployeeAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },

  async archive(context: EmployeeActorContext, id: string): Promise<EmployeeDocument> {
    const before = await this.getById(context.companyId, id);
    const updated = await EmployeeRepository.update(
      id,
      { status: ENTITY_STATUS.ARCHIVED, updatedBy: context.userId },
      { companyId: context.companyId },
    );
    if (!updated) {
      throw new NotFoundError('Employee not found', ERROR_CODES.NOT_FOUND);
    }

    await EmployeeTimelineService.record(context, {
      employeeId: id,
      eventType: EmployeeTimelineService.EVENT.ARCHIVED,
      title: 'Employee archived',
    });

    await EmployeeAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: ENTITY_TYPE,
      entityId: id,
      action: 'archive',
      before: EmployeeAuditService.toRecord(before),
      after: EmployeeAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },

  async restore(context: EmployeeActorContext, id: string): Promise<EmployeeDocument> {
    const before = await this.getById(context.companyId, id, true);
    const updated = await EmployeeRepository.update(
      id,
      { status: ENTITY_STATUS.ACTIVE, updatedBy: context.userId },
      { companyId: context.companyId },
    );
    if (!updated) {
      throw new NotFoundError('Employee not found', ERROR_CODES.NOT_FOUND);
    }

    await EmployeeTimelineService.record(context, {
      employeeId: id,
      eventType: EmployeeTimelineService.EVENT.RESTORED,
      title: 'Employee restored',
    });

    await EmployeeAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: ENTITY_TYPE,
      entityId: id,
      action: 'restore',
      before: EmployeeAuditService.toRecord(before),
      after: EmployeeAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },

  async deactivate(context: EmployeeActorContext, id: string): Promise<EmployeeDocument> {
    const before = await this.getById(context.companyId, id);
    const updated = await EmployeeRepository.update(
      id,
      { status: ENTITY_STATUS.INACTIVE, updatedBy: context.userId },
      { companyId: context.companyId },
    );
    if (!updated) {
      throw new NotFoundError('Employee not found', ERROR_CODES.NOT_FOUND);
    }

    await EmployeeTimelineService.record(context, {
      employeeId: id,
      eventType: EmployeeTimelineService.EVENT.DEACTIVATED,
      title: 'Employee deactivated',
    });

    await EmployeeAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: ENTITY_TYPE,
      entityId: id,
      action: 'deactivate',
      before: EmployeeAuditService.toRecord(before),
      after: EmployeeAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },

  async reactivate(context: EmployeeActorContext, id: string): Promise<EmployeeDocument> {
    const before = await this.getById(context.companyId, id, true);
    const updated = await EmployeeRepository.update(
      id,
      { status: ENTITY_STATUS.ACTIVE, updatedBy: context.userId },
      { companyId: context.companyId },
    );
    if (!updated) {
      throw new NotFoundError('Employee not found', ERROR_CODES.NOT_FOUND);
    }

    await EmployeeTimelineService.record(context, {
      employeeId: id,
      eventType: EmployeeTimelineService.EVENT.REACTIVATED,
      title: 'Employee reactivated',
    });

    await EmployeeAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: ENTITY_TYPE,
      entityId: id,
      action: 'reactivate',
      before: EmployeeAuditService.toRecord(before),
      after: EmployeeAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },

  async delete(context: EmployeeActorContext, id: string): Promise<void> {
    const before = await this.getById(context.companyId, id);
    await EmployeeValidationService.assertManagerHasNoActiveSubordinates(context.companyId, id);

    await EmployeeRepository.softDelete(id, context.userId, { companyId: context.companyId });

    await EmployeeAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: ENTITY_TYPE,
      entityId: id,
      action: 'delete',
      before: EmployeeAuditService.toRecord(before),
      ip: context.ip,
      userAgent: context.userAgent,
    });
  },

  async bulkAction(context: EmployeeActorContext, ids: string[], action: string): Promise<{ processed: number }> {
    let processed = 0;
    for (const id of ids) {
      switch (action) {
        case EMPLOYEE_BULK_ACTION.ARCHIVE:
          await this.archive(context, id);
          break;
        case EMPLOYEE_BULK_ACTION.RESTORE:
          await this.restore(context, id);
          break;
        case EMPLOYEE_BULK_ACTION.DEACTIVATE:
          await this.deactivate(context, id);
          break;
        case EMPLOYEE_BULK_ACTION.REACTIVATE:
          await this.reactivate(context, id);
          break;
        case EMPLOYEE_BULK_ACTION.DELETE:
          await this.delete(context, id);
          break;
        default:
          continue;
      }
      processed += 1;
    }
    return { processed };
  },
};
