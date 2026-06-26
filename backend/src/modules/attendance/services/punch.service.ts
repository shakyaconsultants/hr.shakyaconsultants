import {
  ATTENDANCE_LOG_TYPE,
  AttendanceLogRepository,
} from '@domain/attendance/attendance.schemas.js';
import { BadRequestError, ConflictError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { AttendanceCalculatorService } from '@modules/attendance/services/attendance-calculator.service.js';
import { AttendanceAuditService } from '@modules/attendance/services/attendance-audit.service.js';
import { AttendanceEventService, ATTENDANCE_NOTIFICATION_JOB } from '@modules/attendance/services/attendance-event.service.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import type { AttendanceActorContext } from '@modules/approval/types/approval.types.js';

const PUNCH_SEQUENCE: Record<string, string[]> = {
  [ATTENDANCE_LOG_TYPE.CHECK_IN]: [],
  [ATTENDANCE_LOG_TYPE.BREAK_START]: [ATTENDANCE_LOG_TYPE.CHECK_IN],
  [ATTENDANCE_LOG_TYPE.BREAK_END]: [ATTENDANCE_LOG_TYPE.BREAK_START],
  [ATTENDANCE_LOG_TYPE.CHECK_OUT]: [ATTENDANCE_LOG_TYPE.CHECK_IN],
};

export const PunchService = {
  async punch(context: AttendanceActorContext, payload: {
    type: string;
    employeeId?: string;
    timestamp?: Date;
    location?: string;
    deviceInfo?: string;
  }) {
    const employeeId = payload.employeeId ?? context.employeeId;
    if (!employeeId) {
      throw new BadRequestError('Employee ID is required');
    }

    const timestamp = payload.timestamp ?? new Date();
    const record = await AttendanceCalculatorService.getOrCreateRecord(
      context.companyId,
      employeeId,
      timestamp,
      context.userId,
    );

    const existingLogs = await AttendanceLogRepository.findMany(
      { attendanceId: record.id },
      { companyId: context.companyId },
    );
    existingLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const lastLog = existingLogs[0];

    if (payload.type === ATTENDANCE_LOG_TYPE.CHECK_IN && existingLogs.some((l) => l.type === ATTENDANCE_LOG_TYPE.CHECK_IN && !existingLogs.some((o) => o.type === ATTENDANCE_LOG_TYPE.CHECK_OUT && o.timestamp > l.timestamp))) {
      throw new ConflictError('Already checked in', ERROR_CODES.CONFLICT);
    }

    const requiredPrevious = PUNCH_SEQUENCE[payload.type] ?? [];
    if (requiredPrevious.length > 0 && (!lastLog || !requiredPrevious.includes(lastLog.type))) {
      throw new ConflictError(`Invalid punch sequence for ${payload.type}`, ERROR_CODES.CONFLICT);
    }

    if (payload.type === ATTENDANCE_LOG_TYPE.CHECK_OUT) {
      const hasCheckIn = existingLogs.some((l) => l.type === ATTENDANCE_LOG_TYPE.CHECK_IN);
      if (!hasCheckIn) {
        throw new ConflictError('Check-in required before check-out', ERROR_CODES.CONFLICT);
      }
    }

    const logId = generateUuid();
    const log = await AttendanceLogRepository.create(
      {
        id: logId,
        companyId: context.companyId,
        attendanceId: record.id,
        employeeId,
        type: payload.type,
        timestamp,
        location: payload.location,
        ipAddress: context.ip,
        deviceInfo: payload.deviceInfo,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    const updated = await AttendanceCalculatorService.recalculate(context.companyId, record.id, context.userId);

    await AttendanceAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'attendance_log',
      entityId: logId,
      action: 'punch',
      after: AttendanceAuditService.toRecord(log),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    await AttendanceEventService.publishActivity(context, {
      activityType: 'attendance_punch',
      description: `${payload.type.replace('_', ' ')} recorded`,
      entityType: 'attendance',
      entityId: record.id,
      metadata: { type: payload.type, timestamp },
    });

    const employee = await EmployeeRepository.findById(employeeId, { companyId: context.companyId });
    if (employee?.userId && employee.userId !== context.userId) {
      await AttendanceEventService.notify(context, {
        recipientUserId: employee.userId,
        title: 'Attendance punch recorded',
        body: `${payload.type.replace('_', ' ')} at ${timestamp.toISOString()}`,
        entityType: 'attendance',
        entityId: record.id,
        jobName: ATTENDANCE_NOTIFICATION_JOB.PUNCH_RECORDED,
      });
    }

    return { log, attendance: updated };
  },
};
