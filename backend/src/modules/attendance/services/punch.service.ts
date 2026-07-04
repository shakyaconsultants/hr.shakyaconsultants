import {
  ATTENDANCE_LOG_TYPE,
  AttendanceLogRepository,
} from '@domain/attendance/attendance.schemas.js';
import { BadRequestError, ConflictError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { logger } from '@logging/winston.logger.js';
import { AttendanceCalculatorService } from '@modules/attendance/services/attendance-calculator.service.js';
import { AttendanceAuditService } from '@modules/attendance/services/attendance-audit.service.js';
import { AttendanceEventService, ATTENDANCE_NOTIFICATION_JOB } from '@modules/attendance/services/attendance-event.service.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import type { AttendanceActorContext } from '@modules/approval/types/approval.types.js';

type AttendanceLogDocument = Awaited<ReturnType<typeof AttendanceLogRepository.findMany>>[number];

function sortLogsAsc(logs: AttendanceLogDocument[]) {
  return [...logs].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

function hasOpenCheckIn(logs: AttendanceLogDocument[]): boolean {
  let open = false;
  for (const log of sortLogsAsc(logs)) {
    if (log.type === ATTENDANCE_LOG_TYPE.CHECK_IN) {
      open = true;
    }
    if (log.type === ATTENDANCE_LOG_TYPE.CHECK_OUT) {
      open = false;
    }
  }
  return open;
}

function assertValidPunchSequence(type: string, logs: AttendanceLogDocument[]) {
  const sorted = sortLogsAsc(logs);
  const last = sorted.at(-1);
  const openCheckIn = hasOpenCheckIn(logs);

  switch (type) {
    case ATTENDANCE_LOG_TYPE.CHECK_IN:
      if (openCheckIn) {
        throw new ConflictError('Already checked in', ERROR_CODES.CONFLICT);
      }
      break;
    case ATTENDANCE_LOG_TYPE.CHECK_OUT:
      if (!openCheckIn) {
        throw new ConflictError('Check-in required before check-out', ERROR_CODES.CONFLICT);
      }
      if (last?.type === ATTENDANCE_LOG_TYPE.BREAK_START) {
        throw new ConflictError('End your break before checking out', ERROR_CODES.CONFLICT);
      }
      break;
    case ATTENDANCE_LOG_TYPE.BREAK_START:
      if (!openCheckIn) {
        throw new ConflictError('Check-in required before starting a break', ERROR_CODES.CONFLICT);
      }
      if (last?.type === ATTENDANCE_LOG_TYPE.BREAK_START) {
        throw new ConflictError('Break already in progress', ERROR_CODES.CONFLICT);
      }
      break;
    case ATTENDANCE_LOG_TYPE.BREAK_END:
      if (last?.type !== ATTENDANCE_LOG_TYPE.BREAK_START) {
        throw new ConflictError('No active break to end', ERROR_CODES.CONFLICT);
      }
      break;
    default:
      throw new BadRequestError(`Unsupported punch type: ${type}`);
  }
}

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

    assertValidPunchSequence(payload.type, existingLogs);

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

    const recordAfterPunch = await AttendanceCalculatorService.recalculate(context.companyId, record.id, context.userId);

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

    try {
      await AttendanceEventService.publishActivity(context, {
        activityType: 'attendance_punch',
        description: `${payload.type.replace(/_/g, ' ')} recorded`,
        entityType: 'attendance',
        entityId: record.id,
        metadata: { type: payload.type, timestamp },
      });
    } catch (error) {
      logger.warn('Attendance activity publish failed — punch still recorded', {
        companyId: context.companyId,
        employeeId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    try {
      const employee = await EmployeeRepository.findById(employeeId, { companyId: context.companyId });
      if (employee?.userId && employee.userId !== context.userId) {
        await AttendanceEventService.notify(context, {
          recipientUserId: employee.userId,
          title: 'Attendance punch recorded',
          body: `${payload.type.replace(/_/g, ' ')} at ${timestamp.toISOString()}`,
          entityType: 'attendance',
          entityId: record.id,
          jobName: ATTENDANCE_NOTIFICATION_JOB.PUNCH_RECORDED,
        });
      }
    } catch (error) {
      logger.warn('Attendance notification failed — punch still recorded', {
        companyId: context.companyId,
        employeeId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return { record: recordAfterPunch, log };
  },
};
