import { AssetRepository } from '@domain/employee/employee.schemas.js';
import { FullFinalPreparationRepository } from '@domain/leave-exit/leave-exit.schemas.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import type { LeaveExitActorContext } from '@modules/approval/types/approval.types.js';

export const FullFinalPreparationService = {
  async prepare(context: LeaveExitActorContext, employeeId: string, exitProcessId: string, resignationId: string) {
    const { LeaveBalanceService } = await import('@modules/leave-exit/services/leave-balance.service.js');
    const balances = await LeaveBalanceService.getForEmployee(context.companyId, employeeId);
    const pendingLeaveDays = balances.reduce((sum, b) => sum + b.pending, 0);
    const assets = await AssetRepository.findMany({ employeeId }, { companyId: context.companyId });

    const { generateUuid } = await import('@shared/utils/random-id.util.js');
    const id = generateUuid();
    return FullFinalPreparationRepository.create(
      {
        id,
        companyId: context.companyId,
        employeeId,
        exitProcessId,
        resignationId,
        pendingLeaveDays,
        assetIds: assets.map((a) => a.id),
        noticeRecoveryDays: 0,
        metadata: { preparedBy: context.userId, note: 'Payroll integration pending' },
        preparedAt: new Date(),
        status: ENTITY_STATUS.PENDING,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );
  },

  async getByEmployee(companyId: string, employeeId: string) {
    return FullFinalPreparationRepository.findOne({ employeeId }, { companyId });
  },
};
