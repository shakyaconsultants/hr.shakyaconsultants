import { LeaveRequestRepository, LeaveBalanceRepository } from '@domain/leave-exit/leave-exit.schemas.js';
import { LEAVE_REQUEST_STATUS } from '@domain/leave-exit/leave-exit.schemas.js';
import type { LeavePolicyDocument } from '@domain/leave-exit/leave-exit.schemas.js';
import { ConflictError, ValidationError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';

function daysBetween(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
}

export const LeaveValidationService = {
  calculateTotalDays(startDate: Date, endDate: Date, durationType: string): number {
    if (durationType === 'half_day') {
      return 0.5;
    }
    if (endDate < startDate) {
      throw new ValidationError('End date must be on or after start date');
    }
    return daysBetween(startDate, endDate);
  },

  async assertNoOverlap(
    companyId: string,
    employeeId: string,
    startDate: Date,
    endDate: Date,
    excludeRequestId?: string,
  ): Promise<void> {
    const existing = await LeaveRequestRepository.findMany(
      {
        employeeId,
        status: { $in: [LEAVE_REQUEST_STATUS.PENDING, LEAVE_REQUEST_STATUS.APPROVED] },
      },
      { companyId },
    );

    const overlapping = existing.filter((req) => {
      if (excludeRequestId && req.id === excludeRequestId) {
        return false;
      }
      return req.startDate <= endDate && req.endDate >= startDate;
    });

    if (overlapping.length > 0) {
      throw new ConflictError('Leave dates overlap with an existing request', ERROR_CODES.CONFLICT);
    }
  },

  async assertSufficientBalance(
    companyId: string,
    employeeId: string,
    policy: LeavePolicyDocument,
    totalDays: number,
    year: number,
  ): Promise<void> {
    const balance = await LeaveBalanceRepository.findOne(
      { employeeId, leavePolicyId: policy.id, year },
      { companyId },
    );

    const available = balance?.available ?? policy.annualQuota;
    const projected = available - totalDays;

    if (projected < 0 && !policy.allowNegativeBalance) {
      throw new ConflictError('Insufficient leave balance', ERROR_CODES.CONFLICT);
    }

    if (policy.allowNegativeBalance && policy.maxNegativeBalance !== undefined && projected < -policy.maxNegativeBalance) {
      throw new ConflictError('Leave request exceeds maximum negative balance allowed', ERROR_CODES.CONFLICT);
    }
  },

  assertNoticePeriod(policy: LeavePolicyDocument, startDate: Date, isEmergency: boolean): void {
    if (isEmergency && policy.emergencyLeaveAllowed) {
      return;
    }
    const noticeMs = policy.minNoticeDays * 24 * 60 * 60 * 1000;
    if (startDate.getTime() - Date.now() < noticeMs) {
      throw new ConflictError(`Minimum ${String(policy.minNoticeDays)} day(s) notice required`, ERROR_CODES.CONFLICT);
    }
  },

  assertMaxConsecutive(policy: LeavePolicyDocument, totalDays: number): void {
    if (policy.maxConsecutiveDays && totalDays > policy.maxConsecutiveDays) {
      throw new ConflictError(`Maximum ${String(policy.maxConsecutiveDays)} consecutive days allowed`, ERROR_CODES.CONFLICT);
    }
  },
};
