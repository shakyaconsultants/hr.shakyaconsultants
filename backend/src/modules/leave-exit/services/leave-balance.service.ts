import {
  LeaveBalanceRepository,
  LeaveBalanceLedgerRepository,
  LeavePolicyRepository,
} from '@domain/leave-exit/leave-exit.schemas.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { LEAVE_BALANCE_LEDGER_TYPE } from '@modules/leave-exit/constants/leave-exit.constants.js';
import { LeaveExitAuditService } from '@modules/leave-exit/services/leave-exit-audit.service.js';
import type { LeaveExitActorContext } from '@modules/approval/types/approval.types.js';

function recalculateAvailable(opening: number, earned: number, used: number, pending: number, carryForward: number): number {
  return opening + earned + carryForward - used - pending;
}

export const LeaveBalanceService = {
  async getForEmployee(companyId: string, employeeId: string, year?: number) {
    const targetYear = year ?? new Date().getFullYear();
    return LeaveBalanceRepository.findMany({ employeeId, year: targetYear }, { companyId });
  },

  async ensureBalance(companyId: string, employeeId: string, leavePolicyId: string, year: number) {
    let balance = await LeaveBalanceRepository.findOne({ employeeId, leavePolicyId, year }, { companyId });
    if (balance) {
      return balance;
    }

    const policy = await LeavePolicyRepository.findById(leavePolicyId, { companyId });
    if (!policy) {
      throw new NotFoundError('Leave policy not found', ERROR_CODES.NOT_FOUND);
    }

    const opening = policy.annualQuota;
    const id = generateUuid();
    balance = await LeaveBalanceRepository.create(
      {
        id,
        companyId,
        employeeId,
        leavePolicyId,
        leaveTypeId: policy.leaveTypeId,
        year,
        openingBalance: opening,
        earned: 0,
        used: 0,
        pending: 0,
        available: opening,
        carryForward: 0,
        createdBy: 'system',
        updatedBy: 'system',
      },
      { companyId },
    );

    await LeaveBalanceLedgerRepository.create(
      {
        id: generateUuid(),
        companyId,
        employeeId,
        leavePolicyId,
        leaveTypeId: policy.leaveTypeId,
        entryType: LEAVE_BALANCE_LEDGER_TYPE.OPENING,
        amount: opening,
        balanceAfter: opening,
        notes: 'Opening balance',
        occurredAt: new Date(),
        createdBy: 'system',
        updatedBy: 'system',
      },
      { companyId },
    );

    return balance;
  },

  async reservePending(context: LeaveExitActorContext, employeeId: string, leavePolicyId: string, days: number, referenceId: string) {
    const year = new Date().getFullYear();
    const balance = await this.ensureBalance(context.companyId, employeeId, leavePolicyId, year);

    const pending = balance.pending + days;
    const available = recalculateAvailable(balance.openingBalance, balance.earned, balance.used, pending, balance.carryForward);

    const updated = await LeaveBalanceRepository.update(
      balance.id,
      { pending, available, updatedBy: context.userId },
      { companyId: context.companyId },
    );

    await LeaveBalanceLedgerRepository.create(
      {
        id: generateUuid(),
        companyId: context.companyId,
        employeeId,
        leavePolicyId,
        leaveTypeId: balance.leaveTypeId,
        entryType: LEAVE_BALANCE_LEDGER_TYPE.PENDING,
        amount: days,
        balanceAfter: available,
        referenceType: 'leave_request',
        referenceId,
        occurredAt: new Date(),
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    return updated;
  },

  async finalizeApproved(context: LeaveExitActorContext, employeeId: string, leavePolicyId: string, days: number, _referenceId: string) {
    const year = new Date().getFullYear();
    const balance = await this.ensureBalance(context.companyId, employeeId, leavePolicyId, year);

    const pending = Math.max(0, balance.pending - days);
    const used = balance.used + days;
    const available = recalculateAvailable(balance.openingBalance, balance.earned, used, pending, balance.carryForward);

    return LeaveBalanceRepository.update(
      balance.id,
      { pending, used, available, updatedBy: context.userId },
      { companyId: context.companyId },
    );
  },

  async releasePending(context: LeaveExitActorContext, employeeId: string, leavePolicyId: string, days: number, _referenceId: string) {
    const year = new Date().getFullYear();
    const balance = await this.ensureBalance(context.companyId, employeeId, leavePolicyId, year);

    const pending = Math.max(0, balance.pending - days);
    const available = recalculateAvailable(balance.openingBalance, balance.earned, balance.used, pending, balance.carryForward);

    return LeaveBalanceRepository.update(
      balance.id,
      { pending, available, updatedBy: context.userId },
      { companyId: context.companyId },
    );
  },

  async adjust(context: LeaveExitActorContext, employeeId: string, leavePolicyId: string, amount: number, notes: string) {
    const year = new Date().getFullYear();
    const balance = await this.ensureBalance(context.companyId, employeeId, leavePolicyId, year);
    const earned = balance.earned + amount;
    const available = recalculateAvailable(balance.openingBalance, earned, balance.used, balance.pending, balance.carryForward);

    const updated = await LeaveBalanceRepository.update(
      balance.id,
      { earned, available, updatedBy: context.userId },
      { companyId: context.companyId },
    );

    await LeaveExitAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'leave_balance',
      entityId: balance.id,
      action: 'update',
      after: LeaveExitAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    await LeaveBalanceLedgerRepository.create(
      {
        id: generateUuid(),
        companyId: context.companyId,
        employeeId,
        leavePolicyId,
        leaveTypeId: balance.leaveTypeId,
        entryType: LEAVE_BALANCE_LEDGER_TYPE.ADJUSTMENT,
        amount,
        balanceAfter: available,
        notes,
        occurredAt: new Date(),
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    return updated;
  },
};
