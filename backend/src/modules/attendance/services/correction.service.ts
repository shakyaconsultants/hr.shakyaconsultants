import {
  ATTENDANCE_CORRECTION_STATUS,
  AttendanceAdjustmentRepository,
} from '@domain/attendance/attendance.schemas.js';
import { APPROVAL_REQUEST_STATUS } from '@domain/approval/approval.schemas.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import { NotFoundError, ConflictError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { ApprovalEngineService } from '@modules/approval/services/approval-engine.service.js';
import { APPROVAL_ENTITY_TYPE, APPROVAL_REQUEST_TYPE } from '@modules/approval/constants/approval.constants.js';
import { AttendancePolicyService } from '@modules/attendance/services/attendance-policy.service.js';
import { AttendanceRecordService } from '@modules/attendance/services/attendance-record.service.js';
import { AttendanceCalculatorService } from '@modules/attendance/services/attendance-calculator.service.js';
import { AttendanceAuditService } from '@modules/attendance/services/attendance-audit.service.js';
import { AttendanceEventService, ATTENDANCE_NOTIFICATION_JOB } from '@modules/attendance/services/attendance-event.service.js';
import type { AttendanceActorContext } from '@modules/approval/types/approval.types.js';

export const AttendanceCorrectionService = {
  async list(companyId: string, query: { page?: number; pageSize?: number; employeeId?: string; status?: string }) {
    const filter: Record<string, unknown> = {};
    if (query.employeeId) filter.employeeId = query.employeeId;
    if (query.status) filter.status = query.status;

    return AttendanceAdjustmentRepository.paginate(filter, {
      page: query.page,
      pageSize: query.pageSize,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }, { companyId });
  },

  async getById(companyId: string, id: string) {
    const correction = await AttendanceAdjustmentRepository.findById(id, { companyId });
    if (!correction) {
      throw new NotFoundError('Attendance correction not found', ERROR_CODES.NOT_FOUND);
    }
    return correction;
  },

  async create(context: AttendanceActorContext, payload: {
    attendanceId: string;
    adjustedStatus: string;
    reason: string;
    requestedCheckIn?: Date;
    requestedCheckOut?: Date;
    submit?: boolean;
  }) {
    const attendance = await AttendanceRecordService.getById(context.companyId, payload.attendanceId);
    const id = generateUuid();

    const correction = await AttendanceAdjustmentRepository.create(
      {
        id,
        companyId: context.companyId,
        attendanceId: payload.attendanceId,
        employeeId: attendance.employeeId,
        originalStatus: attendance.status,
        adjustedStatus: payload.adjustedStatus,
        reason: payload.reason,
        adjustedBy: context.userId,
        requestedCheckIn: payload.requestedCheckIn,
        requestedCheckOut: payload.requestedCheckOut,
        status: ATTENDANCE_CORRECTION_STATUS.DRAFT,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    if (payload.submit !== false) {
      return this.submit(context, id);
    }

    return correction;
  },

  async submit(context: AttendanceActorContext, correctionId: string) {
    const correction = await this.getById(context.companyId, correctionId);
    if (correction.status !== ATTENDANCE_CORRECTION_STATUS.DRAFT) {
      throw new ConflictError('Correction already submitted', ERROR_CODES.CONFLICT);
    }

    const policies = await AttendancePolicyService.getPolicies(context.companyId);

    const approval = await ApprovalEngineService.createRequest(context, {
      requestType: APPROVAL_REQUEST_TYPE.ATTENDANCE_CORRECTION,
      entityType: APPROVAL_ENTITY_TYPE.ATTENDANCE_CORRECTION,
      entityId: correctionId,
      workflowSlug: policies.correctionWorkflowSlug,
      requesterEmployeeId: correction.employeeId,
      title: 'Attendance correction request',
      description: correction.reason,
      metadata: {
        attendanceId: correction.attendanceId,
        adjustedStatus: correction.adjustedStatus,
      },
    });

    await ApprovalEngineService.submitRequest(context, approval.id);

    const updated = await AttendanceAdjustmentRepository.update(
      correctionId,
      {
        approvalRequestId: approval.id,
        status: ATTENDANCE_CORRECTION_STATUS.PENDING,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    const employee = await EmployeeRepository.findById(correction.employeeId, { companyId: context.companyId });
    if (employee?.userId) {
      await AttendanceEventService.notify(context, {
        recipientUserId: employee.userId,
        title: 'Attendance correction submitted',
        body: correction.reason,
        entityType: 'attendance_correction',
        entityId: correctionId,
        jobName: ATTENDANCE_NOTIFICATION_JOB.CORRECTION_SUBMITTED,
      });
    }

    await AttendanceAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'attendance_correction',
      entityId: correctionId,
      action: 'create',
      after: AttendanceAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },

  async onApprovalDecision(context: AttendanceActorContext, correctionId: string, approvalStatus: string) {
    const correction = await this.getById(context.companyId, correctionId);

    if (approvalStatus === APPROVAL_REQUEST_STATUS.APPROVED) {
      const updatePayload: Record<string, unknown> = {
        status: correction.adjustedStatus,
        updatedBy: context.userId,
      };
      if (correction.requestedCheckIn) updatePayload.checkIn = correction.requestedCheckIn;
      if (correction.requestedCheckOut) updatePayload.checkOut = correction.requestedCheckOut;

      const { AttendanceRepository } = await import('@domain/attendance/attendance.schemas.js');
      await AttendanceRepository.update(correction.attendanceId, updatePayload, { companyId: context.companyId });
      await AttendanceCalculatorService.recalculate(context.companyId, correction.attendanceId, context.userId);

      const updated = await AttendanceAdjustmentRepository.update(
        correctionId,
        {
          status: ATTENDANCE_CORRECTION_STATUS.APPROVED,
          approvedAt: new Date(),
          updatedBy: context.userId,
        },
        { companyId: context.companyId },
      );

      const employee = await EmployeeRepository.findById(correction.employeeId, { companyId: context.companyId });
      if (employee?.userId) {
        await AttendanceEventService.notify(context, {
          recipientUserId: employee.userId,
          title: 'Attendance correction approved',
          body: correction.reason,
          entityType: 'attendance_correction',
          entityId: correctionId,
          jobName: ATTENDANCE_NOTIFICATION_JOB.CORRECTION_APPROVED,
        });
      }

      await AttendanceAuditService.log({
        companyId: context.companyId,
        userId: context.userId,
        entityType: 'attendance_correction',
        entityId: correctionId,
        action: 'approve',
        after: AttendanceAuditService.toRecord(updated),
        ip: context.ip,
        userAgent: context.userAgent,
      });

      return updated;
    }

    if ([APPROVAL_REQUEST_STATUS.REJECTED, APPROVAL_REQUEST_STATUS.WITHDRAWN, APPROVAL_REQUEST_STATUS.CANCELLED].includes(approvalStatus as typeof APPROVAL_REQUEST_STATUS.REJECTED)) {
      const status = approvalStatus === APPROVAL_REQUEST_STATUS.REJECTED
        ? ATTENDANCE_CORRECTION_STATUS.REJECTED
        : ATTENDANCE_CORRECTION_STATUS.WITHDRAWN;

      const updated = await AttendanceAdjustmentRepository.update(
        correctionId,
        { status, updatedBy: context.userId },
        { companyId: context.companyId },
      );

      const employee = await EmployeeRepository.findById(correction.employeeId, { companyId: context.companyId });
      if (employee?.userId && status === ATTENDANCE_CORRECTION_STATUS.REJECTED) {
        await AttendanceEventService.notify(context, {
          recipientUserId: employee.userId,
          title: 'Attendance correction rejected',
          body: correction.reason,
          entityType: 'attendance_correction',
          entityId: correctionId,
          jobName: ATTENDANCE_NOTIFICATION_JOB.CORRECTION_REJECTED,
        });
      }

      return updated;
    }

    return correction;
  },
};
