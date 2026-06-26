import { APPROVAL_REQUEST_STATUS } from '@domain/approval/approval.schemas.js';
import type { ApprovalRequestDocument } from '@domain/approval/approval.schemas.js';
import type { ApprovalActorContext } from '@modules/approval/types/approval.types.js';
import { APPROVAL_ENTITY_TYPE } from '@modules/approval/constants/approval.constants.js';

export const ApprovalEntitySyncService = {
  async syncOnDecision(context: ApprovalActorContext, request: ApprovalRequestDocument): Promise<void> {
    if (request.entityType === APPROVAL_ENTITY_TYPE.LEAVE_REQUEST) {
      const { LeaveRequestService } = await import('@modules/leave-exit/services/leave-request.service.js');
      await LeaveRequestService.onApprovalDecision(context, request.entityId, request.status);
      return;
    }

    if (request.entityType === APPROVAL_ENTITY_TYPE.RESIGNATION) {
      const { ResignationService } = await import('@modules/leave-exit/services/resignation.service.js');
      await ResignationService.onApprovalDecision(context, request.entityId, request.status);
      return;
    }

    if (request.entityType === APPROVAL_ENTITY_TYPE.EXIT_PROCESS) {
      const { ExitManagementService } = await import('@modules/leave-exit/services/exit-management.service.js');
      await ExitManagementService.onApprovalDecision(context, request.entityId, request.status);
      return;
    }

    if (request.entityType === APPROVAL_ENTITY_TYPE.ATTENDANCE_CORRECTION) {
      const { AttendanceCorrectionService } = await import('@modules/attendance/services/correction.service.js');
      await AttendanceCorrectionService.onApprovalDecision(context, request.entityId, request.status);
      return;
    }

    if (request.entityType === APPROVAL_ENTITY_TYPE.PAYROLL_RUN) {
      const { PayrollProcessingService } = await import('@modules/payroll/services/payroll-processing.service.js');
      await PayrollProcessingService.onApprovalDecision(context, request.entityId, request.status);
      return;
    }

    if (request.entityType === APPROVAL_ENTITY_TYPE.SALARY_REVISION) {
      const { SalaryRevisionService } = await import('@modules/payroll/services/salary-revision.service.js');
      await SalaryRevisionService.onApprovalDecision(context, request.entityId, request.status);
    }
  },

  isTerminalStatus(status: string): boolean {
    return [
      APPROVAL_REQUEST_STATUS.APPROVED,
      APPROVAL_REQUEST_STATUS.REJECTED,
      APPROVAL_REQUEST_STATUS.CANCELLED,
      APPROVAL_REQUEST_STATUS.WITHDRAWN,
    ].includes(status as typeof APPROVAL_REQUEST_STATUS.APPROVED);
  },
};
