import { LeavePolicyRepository } from '@domain/leave-exit/leave-exit.schemas.js';
import type { LeavePolicyDocument } from '@domain/leave-exit/leave-exit.schemas.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { NotFoundError, ConflictError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { LeaveExitAuditService } from '@modules/leave-exit/services/leave-exit-audit.service.js';
import type { LeaveExitActorContext } from '@modules/approval/types/approval.types.js';

export const LeavePolicyService = {
  async list(companyId: string): Promise<LeavePolicyDocument[]> {
    let policies = await LeavePolicyRepository.findMany({ status: ENTITY_STATUS.ACTIVE }, { companyId });
    if (policies.length === 0) {
      const { LeaveExitSeederService } = await import('@modules/leave-exit/services/leave-exit-seeder.service.js');
      await LeaveExitSeederService.seedDefaults({
        companyId,
        userId: 'system',
        employeeId: 'system',
      });
      policies = await LeavePolicyRepository.findMany({ status: ENTITY_STATUS.ACTIVE }, { companyId });
    }
    return policies;
  },

  async getById(companyId: string, id: string): Promise<LeavePolicyDocument> {
    const policy = await LeavePolicyRepository.findById(id, { companyId });
    if (!policy) {
      throw new NotFoundError('Leave policy not found', ERROR_CODES.NOT_FOUND);
    }
    return policy;
  },

  async create(context: LeaveExitActorContext, payload: {
    name: string;
    code: string;
    leaveTypeId: string;
    category: string;
    description?: string;
    annualQuota: number;
    maxConsecutiveDays?: number;
    allowHalfDay?: boolean;
    allowNegativeBalance?: boolean;
    maxNegativeBalance?: number;
    carryForwardEnabled?: boolean;
    maxCarryForwardDays?: number;
    carryForwardExpiryMonths?: number;
    accrualEnabled?: boolean;
    accrualRatePerMonth?: number;
    requiresAttachment?: boolean;
    allowSelfApproval?: boolean;
    minNoticeDays?: number;
    emergencyLeaveAllowed?: boolean;
    applicableDepartmentIds?: string[];
    applicableBranchIds?: string[];
    workflowSlug?: string;
  }): Promise<LeavePolicyDocument> {
    const existing = await LeavePolicyRepository.findOne({ code: payload.code }, { companyId: context.companyId });
    if (existing) {
      throw new ConflictError('Leave policy code already exists', ERROR_CODES.CONFLICT);
    }

    const id = generateUuid();
    const policy = await LeavePolicyRepository.create(
      {
        id,
        companyId: context.companyId,
        name: payload.name,
        code: payload.code.trim().toUpperCase(),
        leaveTypeId: payload.leaveTypeId,
        category: payload.category,
        description: payload.description,
        annualQuota: payload.annualQuota,
        maxConsecutiveDays: payload.maxConsecutiveDays,
        maxNegativeBalance: payload.maxNegativeBalance,
        maxCarryForwardDays: payload.maxCarryForwardDays,
        carryForwardExpiryMonths: payload.carryForwardExpiryMonths,
        accrualRatePerMonth: payload.accrualRatePerMonth,
        workflowSlug: payload.workflowSlug ?? 'leave-default',
        allowHalfDay: payload.allowHalfDay ?? true,
        allowNegativeBalance: payload.allowNegativeBalance ?? false,
        carryForwardEnabled: payload.carryForwardEnabled ?? false,
        accrualEnabled: payload.accrualEnabled ?? false,
        requiresAttachment: payload.requiresAttachment ?? false,
        allowSelfApproval: payload.allowSelfApproval ?? false,
        minNoticeDays: payload.minNoticeDays ?? 0,
        emergencyLeaveAllowed: payload.emergencyLeaveAllowed ?? true,
        applicableDepartmentIds: payload.applicableDepartmentIds ?? [],
        applicableBranchIds: payload.applicableBranchIds ?? [],
        status: ENTITY_STATUS.ACTIVE,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await LeaveExitAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'leave_policy',
      entityId: id,
      action: 'create',
      after: LeaveExitAuditService.toRecord(policy),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return policy;
  },

  async update(context: LeaveExitActorContext, id: string, payload: Partial<LeavePolicyDocument>): Promise<LeavePolicyDocument> {
    const before = await this.getById(context.companyId, id);
    const updated = await LeavePolicyRepository.update(id, { ...payload, updatedBy: context.userId }, { companyId: context.companyId });
    if (!updated) {
      throw new NotFoundError('Leave policy not found', ERROR_CODES.NOT_FOUND);
    }

    await LeaveExitAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'leave_policy',
      entityId: id,
      action: 'update',
      before: LeaveExitAuditService.toRecord(before),
      after: LeaveExitAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },
};
