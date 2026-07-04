import {
  ATTENDANCE_LOG_TYPE,
  AttendanceLogRepository,
  AttendanceRepository,
  ShiftAssignmentRepository,
  type AttendanceDocument,
  type AttendancePayrollSnapshot,
} from '@domain/attendance/attendance.schemas.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import { HolidayRepository, WorkShiftRepository } from '@domain/organization/organization.schemas.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { ATTENDANCE_STATUS } from '@shared/constants/status.constants.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { startOfDay, endOfDay } from '@shared/utils/date.util.js';
import { AttendancePolicyService } from '@modules/attendance/services/attendance-policy.service.js';

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

function minutesBetween(start: Date, end: Date): number {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
}

function combineDateAndTime(date: Date, time: string): Date {
  const result = startOfDay(date);
  const minutes = parseTimeToMinutes(time);
  result.setMinutes(minutes);
  return result;
}

async function resolveWorkShiftId(companyId: string, employeeId: string, date: Date): Promise<string | undefined> {
  const assignments = await ShiftAssignmentRepository.findMany(
    {
      employeeId,
      status: ENTITY_STATUS.ACTIVE,
      effectiveFrom: { $lte: date },
      $or: [{ effectiveTo: { $exists: false } }, { effectiveTo: null }, { effectiveTo: { $gte: date } }],
    },
    { companyId },
  );
  const assignment = assignments.sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime())[0];
  if (assignment) {
    return assignment.workShiftId;
  }

  const employee = await EmployeeRepository.findById(employeeId, { companyId });
  return employee?.shiftId;
}

export const AttendanceCalculatorService = {
  async getOrCreateRecord(companyId: string, employeeId: string, date: Date, userId: string): Promise<AttendanceDocument> {
    const day = startOfDay(date);
    const existing = await AttendanceRepository.findOne({ employeeId, date: day }, { companyId });
    if (existing) {
      return existing;
    }

    const employee = await EmployeeRepository.findById(employeeId, { companyId });
    const shiftId = await resolveWorkShiftId(companyId, employeeId, day);

    return AttendanceRepository.create(
      {
        id: generateUuid(),
        companyId,
        employeeId,
        date: day,
        status: ATTENDANCE_STATUS.ABSENT,
        shiftId,
        departmentId: employee?.departmentId,
        branchId: employee?.branchId,
        breakMinutes: 0,
        lateMinutes: 0,
        earlyExitMinutes: 0,
        overtimeMinutes: 0,
        isWeekend: false,
        isHoliday: false,
        payrollSnapshot: {},
        createdBy: userId,
        updatedBy: userId,
      },
      { companyId },
    );
  },

  async recalculate(companyId: string, attendanceId: string, userId: string): Promise<AttendanceDocument> {
    const record = await AttendanceRepository.findById(attendanceId, { companyId });
    if (!record) {
      throw new NotFoundError('Attendance record not found', ERROR_CODES.NOT_FOUND);
    }

    const policies = await AttendancePolicyService.getPolicies(companyId);
    const day = startOfDay(record.date);
    const dayOfWeek = day.getDay();

    const weeklyOffDays = policies.weeklyOffDays;
    const isWeekend = weeklyOffDays.includes(dayOfWeek);

    const holiday = await HolidayRepository.findOne(
      {
        date: { $gte: day, $lte: endOfDay(day) },
        status: ENTITY_STATUS.ACTIVE,
        $or: [{ branchId: { $exists: false } }, { branchId: null }, { branchId: record.branchId }],
      },
      { companyId },
    );
    const isHoliday = Boolean(holiday);

    const logs = await AttendanceLogRepository.findMany(
      { attendanceId },
      { companyId },
    );
    logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const checkInLog = logs.find((l) => l.type === ATTENDANCE_LOG_TYPE.CHECK_IN);
    const checkOutLog = logs.filter((l) => l.type === ATTENDANCE_LOG_TYPE.CHECK_OUT).at(-1);
    const checkIn = checkInLog?.timestamp;
    const checkOut = checkOutLog?.timestamp;

    let breakMinutes = 0;
    let breakStart: Date | undefined;
    for (const log of logs) {
      if (log.type === ATTENDANCE_LOG_TYPE.BREAK_START) {
        breakStart = log.timestamp;
      } else if (log.type === ATTENDANCE_LOG_TYPE.BREAK_END && breakStart) {
        breakMinutes += minutesBetween(breakStart, log.timestamp);
        breakStart = undefined;
      }
    }

    const shiftId = record.shiftId ?? await resolveWorkShiftId(companyId, record.employeeId, day);
    const shift = shiftId ? await WorkShiftRepository.findById(shiftId, { companyId }) : null;

    let lateMinutes = 0;
    let earlyExitMinutes = 0;
    let overtimeMinutes = 0;
    let workedMinutes = 0;
    let status: string = ATTENDANCE_STATUS.ABSENT;

    if (checkIn && checkOut) {
      workedMinutes = minutesBetween(checkIn, checkOut) - breakMinutes;

      if (shift) {
        const shiftStart = combineDateAndTime(day, shift.startTime);
        const shiftEnd = combineDateAndTime(day, shift.endTime);
        if (shift.isNightShift && shiftEnd <= shiftStart) {
          shiftEnd.setDate(shiftEnd.getDate() + 1);
        }

        const graceEnd = new Date(shiftStart.getTime() + (shift.gracePeriodMinutes + policies.graceMinutes) * 60000);
        if (checkIn > graceEnd) {
          lateMinutes = minutesBetween(graceEnd, checkIn);
        }

        const earlyThreshold = new Date(shiftEnd.getTime() - policies.earlyExitThresholdMinutes * 60000);
        if (checkOut < earlyThreshold) {
          earlyExitMinutes = minutesBetween(checkOut, shiftEnd);
        }

        const expectedMinutes = minutesBetween(shiftStart, shiftEnd) - (shift.breakMinutes ?? 0);
        const overtimeThreshold = expectedMinutes + policies.overtimeThresholdMinutes;
        if (workedMinutes > overtimeThreshold) {
          overtimeMinutes = workedMinutes - expectedMinutes;
        }
      }

      if (workedMinutes >= policies.halfDayThresholdMinutes) {
        status = lateMinutes > policies.lateThresholdMinutes ? ATTENDANCE_STATUS.LATE : ATTENDANCE_STATUS.PRESENT;
      } else if (workedMinutes > 0) {
        status = ATTENDANCE_STATUS.HALF_DAY;
      }
    } else if (checkIn && !checkOut) {
      status = ATTENDANCE_STATUS.HALF_DAY;
    }

    if (!checkIn && isHoliday) {
      status = ATTENDANCE_STATUS.HOLIDAY;
    } else if (!checkIn && isWeekend) {
      status = ATTENDANCE_STATUS.WEEKEND;
    }

    const updated = await AttendanceRepository.update(
      attendanceId,
      {
        shiftId,
        checkIn,
        checkOut,
        workedMinutes,
        breakMinutes,
        lateMinutes,
        earlyExitMinutes,
        overtimeMinutes,
        isWeekend,
        isHoliday,
        status,
        payrollSnapshot: this.buildPayrollSnapshot(record, status, workedMinutes, lateMinutes, earlyExitMinutes, overtimeMinutes, breakMinutes),
        updatedBy: userId,
      },
      { companyId },
    );

    return updated!;
  },

  buildPayrollSnapshot(
    record: AttendanceDocument,
    status: string,
    workedMinutes: number,
    lateMinutes: number,
    earlyExitMinutes: number,
    overtimeMinutes: number,
    breakMinutes: number,
  ): AttendancePayrollSnapshot {
    const payableStatuses: string[] = [ATTENDANCE_STATUS.PRESENT, ATTENDANCE_STATUS.LATE, ATTENDANCE_STATUS.HOLIDAY];
    const payableDays = payableStatuses.includes(status)
      ? 1
      : status === ATTENDANCE_STATUS.HALF_DAY
        ? 0.5
        : 0;

    return {
      date: record.date,
      employeeId: record.employeeId,
      departmentId: record.departmentId,
      branchId: record.branchId,
      status,
      workedMinutes,
      breakMinutes,
      lateMinutes,
      earlyExitMinutes,
      overtimeMinutes,
      payableDays,
      lopDays: payableDays === 0 && status !== ATTENDANCE_STATUS.WEEKEND ? 1 : 0,
    };
  },
};
