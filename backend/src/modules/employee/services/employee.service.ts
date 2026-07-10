import type { EmployeeDocument } from '@domain/employee/employee.schemas.js';
import {
  EmployeeRepository,
  EMPLOYEE_EMPLOYMENT_STATUS,
} from '@domain/employee/employee.schemas.js';
import { NotFoundError, ConflictError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { EmployeeAuditService } from '@modules/employee/services/employee-audit.service.js';
import { EmployeeNumberService } from '@modules/employee/services/employee-number.service.js';
import { EmployeeQueryService } from '@modules/employee/services/employee-query.service.js';
import { EmployeeTimelineService } from '@modules/employee/services/employee-timeline.service.js';
import { EmployeeValidationService } from '@modules/employee/services/employee-validation.service.js';
import { EMPLOYEE_BULK_ACTION } from '@modules/employee/constants/employee.constants.js';
import type {
  EmployeeActorContext,
  EmployeeListQuery,
} from '@modules/employee/types/employee.types.js';
import {
  EmployeeLifecycleService,
  EMPLOYEE_LIFECYCLE_EMAIL,
} from '@modules/employee/services/employee-lifecycle.service.js';
import { EmployeeAccountService } from '@modules/employee/services/employee-account.service.js';
import { OnboardingService } from '@modules/recruitment/services/onboarding.service.js';
import { EmployeePurgeService } from '@modules/employee/services/employee-purge.service.js';
import { EmployeeProvisioningService } from '@modules/employee/services/employee-provisioning.service.js';
import { UserRepository } from '@domain/auth/user.schema.js';
import { SystemAdminProfileService } from '@modules/auth/services/system-admin-profile.service.js';
import { logger } from '@logging/winston.logger.js';

const ENTITY_TYPE = 'employee';

const ADMIN_CREATE_FIELD_KEYS = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'departmentId',
  'designationId',
  'branchId',
  'shiftId',
  'employmentTypeId',
  'reportingManagerId',
  'dottedManagerId',
  'joinedAt',
  'probationEndDate',
  'confirmationDate',
  'employmentType',
  'employmentStatus',
] as const;

function sanitizeCreatePayload(payload: Record<string, unknown>): Record<string, unknown> {
  const { employeeNumber: _removed, aadhaarNumber, panNumber, branchId, phone, ...rest } = payload;

  const isEmpty = (value: unknown): boolean =>
    value === null || value === undefined || (typeof value === 'string' && value.trim() === '');

  return {
    ...rest,
    ...(isEmpty(aadhaarNumber) ? {} : { aadhaarNumber }),
    ...(isEmpty(panNumber) ? {} : { panNumber }),
    ...(isEmpty(branchId) ? {} : { branchId }),
    ...(isEmpty(phone) ? {} : { phone }),
  };
}

function pickAdminCreatePayload(payload: Record<string, unknown>): Record<string, unknown> {
  const picked: Record<string, unknown> = {};
  for (const key of ADMIN_CREATE_FIELD_KEYS) {
    if (payload[key] !== undefined) {
      picked[key] = payload[key];
    }
  }
  return sanitizeCreatePayload(picked);
}

async function prepareWorkforceCreate(context: EmployeeActorContext): Promise<void> {
  const actorUser = await UserRepository.findById(context.userId, { companyId: context.companyId });
  if (
    actorUser &&
    (await SystemAdminProfileService.isLegacyEmployeeLinkedAdmin(context.companyId, actorUser))
  ) {
    await SystemAdminProfileService.migrateLegacyEmployeeLinkedAdmin(context.companyId, actorUser);
  }
}

export interface EmployeeCreateResult {
  employee: EmployeeDocument;
  welcomeEmailSent: boolean;
  welcomeEmailError?: string;
}

function omitEmailField(payload: Record<string, unknown>): Record<string, unknown> {
  const { email: _removed, ...rest } = payload;
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

  async create(
    context: EmployeeActorContext,
    payload: Record<string, unknown>,
  ): Promise<EmployeeCreateResult> {
    const email = typeof payload.email === 'string' ? payload.email.toLowerCase() : '';
    const departmentId = typeof payload.departmentId === 'string' ? payload.departmentId : '';
    const designationId = typeof payload.designationId === 'string' ? payload.designationId : '';
    const branchId = typeof payload.branchId === 'string' ? payload.branchId : undefined;

    await prepareWorkforceCreate(context);

    await EmployeeValidationService.assertOrganizationPlacement(context.companyId, {
      departmentId,
      designationId,
      branchId,
    });

    const emailAvailability = await EmployeeValidationService.prepareEmailForCreate(
      context.companyId,
      email,
      context.userId,
    );
    if (!emailAvailability.available) {
      throw new ConflictError(emailAvailability.message, ERROR_CODES.EMAIL_ALREADY_EXISTS, {
        field: 'email',
        value: email,
        reason: emailAvailability.reason,
        employeeId: emailAvailability.employeeId,
      });
    }

    if (typeof payload.reportingManagerId === 'string') {
      await EmployeeValidationService.assertManagerExists(
        context.companyId,
        payload.reportingManagerId,
      );
    }

    const employeeNumber = await EmployeeNumberService.generate(context.companyId, context.userId);
    const id = generateUuid();
    const sanitized = omitEmailField(pickAdminCreatePayload(payload));
    const temporaryPassword =
      typeof payload.temporaryPassword === 'string' && payload.temporaryPassword.trim().length >= 6
        ? payload.temporaryPassword.trim()
        : EmployeeAccountService.resolveTemporaryPassword();

    let employee = await EmployeeRepository.create(
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

    try {
      const { userId } = await EmployeeAccountService.provisionPortalUser({
        companyId: context.companyId,
        userId: context.userId,
        email,
        employeeId: id,
        temporaryPassword,
      });

      const linked = await EmployeeRepository.update(
        id,
        { userId, updatedBy: context.userId },
        { companyId: context.companyId },
      );
      if (linked) {
        employee = linked;
      }

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

      await EmployeeProvisioningService.ensureDefaultEmployeeRole(context.companyId, id, {
        companyId: context.companyId,
        userId: context.userId,
        employeeId: id,
        ip: context.ip,
        userAgent: context.userAgent,
      });

      try {
        await OnboardingService.startForEmployee(
          { companyId: context.companyId, userId: context.userId },
          id,
          employee.joinedAt,
        );
      } catch (onboardingError) {
        logger.warn('Employee onboarding record could not be started', {
          employeeId: id,
          email,
          message:
            onboardingError instanceof Error ? onboardingError.message : String(onboardingError),
        });
      }

      const welcomeEmailSent = false;
      const welcomeEmailError: string | undefined = undefined;
      void EmployeeAccountService.sendWelcomeCredentialsEmail(context, id, temporaryPassword, {
        skipProvisioning: true,
      }).catch(async (emailError: unknown) => {
        await EmployeeLifecycleService.recordEmailFailure(
          context.companyId,
          id,
          EMPLOYEE_LIFECYCLE_EMAIL.ACCOUNT_ACTIVATION,
          context.userId,
          emailError,
        );
        logger.error('Failed to send welcome credentials email', {
          employeeId: id,
          email,
          message: emailError instanceof Error ? emailError.message : String(emailError),
        });
      });

      return { employee, welcomeEmailSent, welcomeEmailError };
    } catch (postCreateError) {
      try {
        await EmployeePurgeService.hardDelete(context, id);
      } catch (rollbackError) {
        logger.error('Failed to rollback employee after create failure', {
          companyId: context.companyId,
          employeeId: id,
          email,
          rollbackError:
            rollbackError instanceof Error ? rollbackError.message : String(rollbackError),
          postCreateError:
            postCreateError instanceof Error ? postCreateError.message : String(postCreateError),
        });
      }
      throw postCreateError;
    }
  },

  async update(
    context: EmployeeActorContext,
    id: string,
    payload: Record<string, unknown>,
  ): Promise<EmployeeDocument> {
    const before = await this.getById(context.companyId, id);
    const { employeeNumber: _removed, ...updates } = payload;

    const nextDepartmentId =
      typeof updates.departmentId === 'string' ? updates.departmentId : before.departmentId;
    const nextDesignationId =
      typeof updates.designationId === 'string' ? updates.designationId : before.designationId;
    const nextBranchId = typeof updates.branchId === 'string' ? updates.branchId : before.branchId;

    if (
      nextDepartmentId !== before.departmentId ||
      nextDesignationId !== before.designationId ||
      nextBranchId !== before.branchId
    ) {
      await EmployeeValidationService.assertOrganizationPlacement(context.companyId, {
        departmentId: nextDepartmentId,
        designationId: nextDesignationId,
        branchId: nextBranchId,
      });
    }

    if (typeof updates.email === 'string') {
      await EmployeeValidationService.assertUniqueEmail(context.companyId, updates.email, id);
    }
    if (updates.aadhaarNumber !== undefined) {
      await EmployeeValidationService.assertUniqueAadhaar(
        context.companyId,
        updates.aadhaarNumber as string | undefined,
        id,
      );
    }
    if (updates.panNumber !== undefined) {
      await EmployeeValidationService.assertUniquePan(
        context.companyId,
        updates.panNumber as string | undefined,
        id,
      );
    }

    const managerId = updates.reportingManagerId as string | undefined;
    if (managerId !== undefined) {
      await EmployeeValidationService.assertNoManagerLoop(context.companyId, id, managerId);
      if (managerId && managerId !== before.reportingManagerId) {
        await EmployeeValidationService.assertManagerExists(context.companyId, managerId);
      }
    }

    const updated = await EmployeeRepository.update(
      id,
      { ...updates, updatedBy: context.userId },
      { companyId: context.companyId },
    );
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

  async archive(context: EmployeeActorContext, id: string): Promise<void> {
    await this.delete(context, id);
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
    const before = await this.getById(context.companyId, id, true);
    await EmployeeValidationService.assertManagerHasNoActiveSubordinates(context.companyId, id);

    await EmployeePurgeService.hardDelete(context, id);

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

  async bulkAction(
    context: EmployeeActorContext,
    ids: string[],
    action: string,
  ): Promise<{ processed: number }> {
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
