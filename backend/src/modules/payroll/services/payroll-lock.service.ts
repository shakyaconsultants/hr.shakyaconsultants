import { PayrollRepository } from '@domain/payroll/payroll.schemas.js';
import { PAYROLL_STATUS } from '@shared/constants/status.constants.js';
import { ConflictError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { PayrollProcessingService } from '@modules/payroll/services/payroll-processing.service.js';
import { PayrollAuditService } from '@modules/payroll/services/payroll-audit.service.js';
import { PayrollEventService, PAYROLL_NOTIFICATION_JOB } from '@modules/payroll/services/payroll-event.service.js';
import type { PayrollActorContext } from '@modules/approval/types/approval.types.js';

export const PayrollLockService = {
  async lock(context: PayrollActorContext, payrollId: string) {
    const payroll = await PayrollProcessingService.getById(context.companyId, payrollId);
    if (payroll.isLocked) {
      throw new ConflictError('Payroll is already locked', ERROR_CODES.CONFLICT);
    }

    const updated = await PayrollRepository.update(
      payrollId,
      {
        isLocked: true,
        lockedAt: new Date(),
        lockedBy: context.userId,
        status: PAYROLL_STATUS.LOCKED,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await PayrollEventService.publishActivity(context, {
      activityType: 'payroll_locked',
      description: `Payroll locked for ${payroll.periodLabel}`,
      entityType: 'payroll_run',
      entityId: payrollId,
    });

    if (context.userId) {
      await PayrollEventService.notify(context, {
        recipientUserId: context.userId,
        title: 'Payroll locked',
        body: `Payroll for ${payroll.periodLabel} has been locked`,
        entityType: 'payroll_run',
        entityId: payrollId,
        jobName: PAYROLL_NOTIFICATION_JOB.RUN_LOCKED,
      });
    }

    await PayrollAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'payroll_run',
      entityId: payrollId,
      action: 'lock',
      after: PayrollAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },

  async unlock(context: PayrollActorContext, payrollId: string) {
    const payroll = await PayrollProcessingService.getById(context.companyId, payrollId);
    if (!payroll.isLocked) {
      throw new ConflictError('Payroll is not locked', ERROR_CODES.CONFLICT);
    }

    const status = payroll.approvalRequestId ? PAYROLL_STATUS.APPROVED : PAYROLL_STATUS.DRAFT;

    const updated = await PayrollRepository.update(
      payrollId,
      {
        isLocked: false,
        lockedAt: undefined,
        lockedBy: undefined,
        status,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await PayrollAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'payroll_run',
      entityId: payrollId,
      action: 'unlock',
      after: PayrollAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },
};
