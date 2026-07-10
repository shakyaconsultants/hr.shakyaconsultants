import {
  ATTENDANCE_LOG_SOURCE,
  AttendanceLogRepository,
  AttendanceRepository,
} from '@domain/attendance/attendance.schemas.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { PunchService } from '@modules/attendance/services/punch.service.js';
import type { AttendanceActorContext } from '@modules/approval/types/approval.types.js';

export interface ExternalPunchInput {
  externalId: string;
  employeeNumber: string;
  type: string;
  timestamp: Date;
  deviceCode?: string;
  location?: string;
}

export const ExternalPunchService = {
  async ingest(context: AttendanceActorContext, payload: ExternalPunchInput) {
    const existing = await AttendanceLogRepository.findOne(
      { externalId: payload.externalId },
      { companyId: context.companyId },
    );

    if (existing) {
      const record = await AttendanceRepository.findById(existing.attendanceId, {
        companyId: context.companyId,
      });
      return { record, log: existing, duplicate: true as const };
    }

    const employee = await EmployeeRepository.findOne(
      {
        employeeNumber: payload.employeeNumber.trim().toUpperCase(),
        status: ENTITY_STATUS.ACTIVE,
      },
      { companyId: context.companyId },
    );

    if (!employee) {
      throw new NotFoundError(
        `Employee not found for number: ${payload.employeeNumber}`,
        ERROR_CODES.NOT_FOUND,
      );
    }

    const result = await PunchService.punch(context, {
      type: payload.type,
      employeeId: employee.id,
      timestamp: payload.timestamp,
      location: payload.location,
      deviceInfo: payload.deviceCode ? `kiosk:${payload.deviceCode}` : 'kiosk:external',
      source: ATTENDANCE_LOG_SOURCE.EXTERNAL,
      externalId: payload.externalId,
      deviceCode: payload.deviceCode,
    });

    return { ...result, duplicate: false as const };
  },
};
