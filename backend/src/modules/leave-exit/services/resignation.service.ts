import {
  RESIGNATION_STATUS,
  ResignationRepository,
} from '@domain/leave-exit/leave-exit.schemas.js';
import { APPROVAL_REQUEST_STATUS } from '@domain/approval/approval.schemas.js';
import { NotFoundError, ConflictError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { ApprovalEngineService } from '@modules/approval/services/approval-engine.service.js';
import { APPROVAL_ENTITY_TYPE, APPROVAL_REQUEST_TYPE } from '@modules/approval/constants/approval.constants.js';
import { LeaveExitAuditService } from '@modules/leave-exit/services/leave-exit-audit.service.js';
import { LeaveExitEventService, LEAVE_EXIT_NOTIFICATION_JOB } from '@modules/leave-exit/services/leave-exit-event.service.js';
import type { LeaveExitActorContext } from '@modules/approval/types/approval.types.js';

export const ResignationService = {
  async list(companyId: string, employeeId?: string) {
    const filter = employeeId ? { employeeId } : {};
    return ResignationRepository.findMany(filter, { companyId });
  },

  async getById(companyId: string, id: string) {
    const record = await ResignationRepository.findById(id, { companyId });
    if (!record) {
      throw new NotFoundError('Resignation not found', ERROR_CODES.NOT_FOUND);
    }
    return record;
  },

  async submit(context: LeaveExitActorContext, payload: {
    employeeId: string;
    reason: string;
    noticePeriodDays: number;
    expectedLastWorkingDay: Date;
    comments?: string;
  }) {
    const active = await ResignationRepository.findOne(
      { employeeId: payload.employeeId, status: { $in: [RESIGNATION_STATUS.PENDING, RESIGNATION_STATUS.SUBMITTED] } },
      { companyId: context.companyId },
    );
    if (active) {
      throw new ConflictError('An active resignation already exists', ERROR_CODES.CONFLICT);
    }

    const id = generateUuid();
    await ResignationRepository.create(
      {
        id,
        companyId: context.companyId,
        employeeId: payload.employeeId,
        reason: payload.reason,
        noticePeriodDays: payload.noticePeriodDays,
        expectedLastWorkingDay: payload.expectedLastWorkingDay,
        comments: payload.comments,
        status: RESIGNATION_STATUS.DRAFT,
        attachmentIds: [],
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    const approval = await ApprovalEngineService.createRequest(context, {
      requestType: APPROVAL_REQUEST_TYPE.RESIGNATION,
      entityType: APPROVAL_ENTITY_TYPE.RESIGNATION,
      entityId: id,
      workflowSlug: 'resignation-default',
      requesterEmployeeId: payload.employeeId,
      title: 'Resignation request',
      description: payload.reason,
      metadata: { expectedLastWorkingDay: payload.expectedLastWorkingDay },
    });

    await ApprovalEngineService.submitRequest(context, approval.id);

    const updated = await ResignationRepository.update(
      id,
      {
        approvalRequestId: approval.id,
        status: RESIGNATION_STATUS.PENDING,
        submittedAt: new Date(),
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await LeaveExitEventService.notify(context, {
      recipientUserId: context.userId,
      title: 'Resignation submitted',
      body: payload.reason,
      entityType: 'resignation',
      entityId: id,
      jobName: LEAVE_EXIT_NOTIFICATION_JOB.RESIGNATION_SUBMITTED,
    });

    await LeaveExitAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'resignation',
      entityId: id,
      action: 'create',
      after: LeaveExitAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },

  async withdraw(context: LeaveExitActorContext, id: string) {
    const resignation = await this.getById(context.companyId, id);
    if (resignation.approvalRequestId) {
      await ApprovalEngineService.withdraw(context, resignation.approvalRequestId);
    }
    return ResignationRepository.update(
      id,
      { status: RESIGNATION_STATUS.WITHDRAWN, updatedBy: context.userId },
      { companyId: context.companyId },
    );
  },

  async onApprovalDecision(context: LeaveExitActorContext, resignationId: string, approvalStatus: string) {
    const resignation = await this.getById(context.companyId, resignationId);

    if (approvalStatus === APPROVAL_REQUEST_STATUS.APPROVED) {
      const updated = await ResignationRepository.update(
        resignationId,
        { status: RESIGNATION_STATUS.ACCEPTED, acceptedAt: new Date(), updatedBy: context.userId },
        { companyId: context.companyId },
      );

      if (updated) {
        const { ExitManagementService } = await import('@modules/leave-exit/services/exit-management.service.js');
        await ExitManagementService.startExitProcess(context, updated);
      }
      return updated;
    }

    if (approvalStatus === APPROVAL_REQUEST_STATUS.REJECTED) {
      return ResignationRepository.update(
        resignationId,
        { status: RESIGNATION_STATUS.REJECTED, updatedBy: context.userId },
        { companyId: context.companyId },
      );
    }

    if (approvalStatus === APPROVAL_REQUEST_STATUS.WITHDRAWN) {
      return ResignationRepository.update(
        resignationId,
        { status: RESIGNATION_STATUS.WITHDRAWN, updatedBy: context.userId },
        { companyId: context.companyId },
      );
    }

    return resignation;
  },
};
