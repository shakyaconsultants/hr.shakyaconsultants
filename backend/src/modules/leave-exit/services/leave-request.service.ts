import {
  LEAVE_REQUEST_STATUS,
  LeaveRequestRepository,
} from '@domain/leave-exit/leave-exit.schemas.js';
import { APPROVAL_REQUEST_STATUS } from '@domain/approval/approval.schemas.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import { NotFoundError, ConflictError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { ApprovalEngineService } from '@modules/approval/services/approval-engine.service.js';
import { APPROVAL_ENTITY_TYPE, APPROVAL_REQUEST_TYPE } from '@modules/approval/constants/approval.constants.js';
import { LeavePolicyService } from '@modules/leave-exit/services/leave-policy.service.js';
import { LeaveBalanceService } from '@modules/leave-exit/services/leave-balance.service.js';
import { LeaveValidationService } from '@modules/leave-exit/services/leave-validation.service.js';
import { LeaveExitAuditService } from '@modules/leave-exit/services/leave-exit-audit.service.js';
import { LeaveExitEventService, LEAVE_EXIT_NOTIFICATION_JOB } from '@modules/leave-exit/services/leave-exit-event.service.js';
import type { LeaveExitActorContext } from '@modules/approval/types/approval.types.js';

export const LeaveRequestService = {
  async list(companyId: string, query: { employeeId?: string; status?: string; page?: number; pageSize?: number }) {
    const filter: Record<string, unknown> = {};
    if (query.employeeId) {
      filter.employeeId = query.employeeId;
    }
    if (query.status) {
      filter.status = query.status;
    }
    return LeaveRequestRepository.paginate(filter, {
      page: query.page,
      pageSize: query.pageSize,
      sortBy: 'startDate',
      sortOrder: 'desc',
    }, { companyId });
  },

  async getById(companyId: string, id: string) {
    const request = await LeaveRequestRepository.findById(id, { companyId });
    if (!request) {
      throw new NotFoundError('Leave request not found', ERROR_CODES.NOT_FOUND);
    }
    return request;
  },

  async apply(context: LeaveExitActorContext, payload: {
    employeeId: string;
    leavePolicyId: string;
    startDate: Date;
    endDate: Date;
    durationType: string;
    halfDaySession?: string;
    reason: string;
    isEmergency?: boolean;
    submit?: boolean;
  }) {
    const policy = await LeavePolicyService.getById(context.companyId, payload.leavePolicyId);
    const totalDays = LeaveValidationService.calculateTotalDays(payload.startDate, payload.endDate, payload.durationType);

    LeaveValidationService.assertMaxConsecutive(policy, totalDays);
    LeaveValidationService.assertNoticePeriod(policy, payload.startDate, payload.isEmergency ?? false);
    await LeaveValidationService.assertNoOverlap(context.companyId, payload.employeeId, payload.startDate, payload.endDate);
    await LeaveValidationService.assertSufficientBalance(context.companyId, payload.employeeId, policy, totalDays, payload.startDate.getFullYear());

    const id = generateUuid();
    const leaveRequest = await LeaveRequestRepository.create(
      {
        id,
        companyId: context.companyId,
        employeeId: payload.employeeId,
        leavePolicyId: policy.id,
        leaveTypeId: policy.leaveTypeId,
        startDate: payload.startDate,
        endDate: payload.endDate,
        durationType: payload.durationType,
        halfDaySession: payload.halfDaySession,
        totalDays,
        reason: payload.reason,
        isEmergency: payload.isEmergency ?? false,
        status: LEAVE_REQUEST_STATUS.DRAFT,
        attachmentIds: [],
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    if (payload.submit !== false) {
      return this.submit(context, id);
    }

    return leaveRequest;
  },

  async submit(context: LeaveExitActorContext, leaveRequestId: string) {
    const leaveRequest = await this.getById(context.companyId, leaveRequestId);
    if (leaveRequest.status !== LEAVE_REQUEST_STATUS.DRAFT) {
      throw new ConflictError('Leave request already submitted', ERROR_CODES.CONFLICT);
    }

    const policy = await LeavePolicyService.getById(context.companyId, leaveRequest.leavePolicyId);
    await LeaveBalanceService.reservePending(context, leaveRequest.employeeId, policy.id, leaveRequest.totalDays, leaveRequestId);

    const approval = await ApprovalEngineService.createRequest(context, {
      requestType: APPROVAL_REQUEST_TYPE.LEAVE,
      entityType: APPROVAL_ENTITY_TYPE.LEAVE_REQUEST,
      entityId: leaveRequestId,
      workflowSlug: policy.workflowSlug,
      requesterEmployeeId: leaveRequest.employeeId,
      title: `Leave request (${String(leaveRequest.totalDays)} day(s))`,
      description: leaveRequest.reason,
      metadata: { leavePolicyId: policy.id, totalDays: leaveRequest.totalDays },
    });

    await ApprovalEngineService.submitRequest(context, approval.id);

    const updated = await LeaveRequestRepository.update(
      leaveRequestId,
      {
        approvalRequestId: approval.id,
        status: LEAVE_REQUEST_STATUS.PENDING,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    const employee = await EmployeeRepository.findById(leaveRequest.employeeId, { companyId: context.companyId });
    if (employee?.userId) {
      await LeaveExitEventService.notify(context, {
        recipientUserId: employee.userId,
        title: 'Leave request submitted',
        body: leaveRequest.reason,
        entityType: 'leave_request',
        entityId: leaveRequestId,
        jobName: LEAVE_EXIT_NOTIFICATION_JOB.LEAVE_APPLIED,
      });
    }

    await LeaveExitAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'leave_request',
      entityId: leaveRequestId,
      action: 'create',
      after: LeaveExitAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },

  async withdraw(context: LeaveExitActorContext, leaveRequestId: string) {
    const leaveRequest = await this.getById(context.companyId, leaveRequestId);
    if (leaveRequest.approvalRequestId) {
      await ApprovalEngineService.withdraw(context, leaveRequest.approvalRequestId);
    }

    await LeaveBalanceService.releasePending(context, leaveRequest.employeeId, leaveRequest.leavePolicyId, leaveRequest.totalDays, leaveRequestId);

    return LeaveRequestRepository.update(
      leaveRequestId,
      { status: LEAVE_REQUEST_STATUS.WITHDRAWN, updatedBy: context.userId },
      { companyId: context.companyId },
    );
  },

  async onApprovalDecision(context: LeaveExitActorContext, leaveRequestId: string, approvalStatus: string) {
    const leaveRequest = await this.getById(context.companyId, leaveRequestId);

    if (approvalStatus === APPROVAL_REQUEST_STATUS.APPROVED) {
      await LeaveBalanceService.finalizeApproved(context, leaveRequest.employeeId, leaveRequest.leavePolicyId, leaveRequest.totalDays, leaveRequestId);
      const updated = await LeaveRequestRepository.update(
        leaveRequestId,
        { status: LEAVE_REQUEST_STATUS.APPROVED, updatedBy: context.userId },
        { companyId: context.companyId },
      );

      const employee = await EmployeeRepository.findById(leaveRequest.employeeId, { companyId: context.companyId });
      if (employee?.userId) {
        await LeaveExitEventService.notify(context, {
          recipientUserId: employee.userId,
          title: 'Leave approved',
          body: `Your leave request for ${String(leaveRequest.totalDays)} day(s) was approved.`,
          entityType: 'leave_request',
          entityId: leaveRequestId,
          jobName: LEAVE_EXIT_NOTIFICATION_JOB.LEAVE_APPROVED,
        });
      }
      return updated;
    }

    if ([APPROVAL_REQUEST_STATUS.REJECTED, APPROVAL_REQUEST_STATUS.WITHDRAWN, APPROVAL_REQUEST_STATUS.CANCELLED].includes(approvalStatus as typeof APPROVAL_REQUEST_STATUS.REJECTED)) {
      await LeaveBalanceService.releasePending(context, leaveRequest.employeeId, leaveRequest.leavePolicyId, leaveRequest.totalDays, leaveRequestId);
      const status = approvalStatus === APPROVAL_REQUEST_STATUS.REJECTED ? LEAVE_REQUEST_STATUS.REJECTED : LEAVE_REQUEST_STATUS.WITHDRAWN;
      const updated = await LeaveRequestRepository.update(
        leaveRequestId,
        { status, updatedBy: context.userId },
        { companyId: context.companyId },
      );

      const employee = await EmployeeRepository.findById(leaveRequest.employeeId, { companyId: context.companyId });
      if (employee?.userId && status === LEAVE_REQUEST_STATUS.REJECTED) {
        await LeaveExitEventService.notify(context, {
          recipientUserId: employee.userId,
          title: 'Leave rejected',
          body: 'Your leave request was rejected.',
          entityType: 'leave_request',
          entityId: leaveRequestId,
          jobName: LEAVE_EXIT_NOTIFICATION_JOB.LEAVE_REJECTED,
        });
      }
      return updated;
    }

    return leaveRequest;
  },

  async getCalendar(companyId: string, startDate: string, endDate: string, employeeId?: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const filter: Record<string, unknown> = {
      status: LEAVE_REQUEST_STATUS.APPROVED,
      startDate: { $lte: end },
      endDate: { $gte: start },
    };
    if (employeeId) {
      filter.employeeId = employeeId;
    }
    const requests = await LeaveRequestRepository.findMany(filter, { companyId });
    return requests.map((r) => ({
      id: r.id,
      employeeId: r.employeeId,
      startDate: r.startDate,
      endDate: r.endDate,
      totalDays: r.totalDays,
      type: 'approved_leave',
    }));
  },
};
