import {
  ATTENDANCE_LOG_TYPE,
  AttendanceLogRepository,
  AttendanceRepository,
} from '@domain/attendance/attendance.schemas.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { startOfDay, endOfDay } from '@shared/utils/date.util.js';
import { AttendanceCalculatorService } from '@modules/attendance/services/attendance-calculator.service.js';
import { AttendanceAuditService } from '@modules/attendance/services/attendance-audit.service.js';
import type { AttendanceActorContext } from '@modules/approval/types/approval.types.js';
import { ATTENDANCE_STATUS } from '@shared/constants/status.constants.js';

export const AttendanceRecordService = {
  async list(companyId: string, query: {
    page?: number;
    pageSize?: number;
    employeeId?: string;
    departmentId?: string;
    branchId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const filter: Record<string, unknown> = {};
    if (query.employeeId) filter.employeeId = query.employeeId;
    if (query.departmentId) filter.departmentId = query.departmentId;
    if (query.branchId) filter.branchId = query.branchId;
    if (query.status) filter.status = query.status;
    if (query.startDate || query.endDate) {
      filter.date = {};
      if (query.startDate) (filter.date as Record<string, Date>).$gte = startOfDay(new Date(query.startDate));
      if (query.endDate) (filter.date as Record<string, Date>).$lte = endOfDay(new Date(query.endDate));
    }

    return AttendanceRepository.paginate(filter, {
      page: query.page,
      pageSize: query.pageSize,
      sortBy: 'date',
      sortOrder: 'desc',
    }, { companyId });
  },

  async getById(companyId: string, id: string) {
    const record = await AttendanceRepository.findById(id, { companyId });
    if (!record) {
      throw new NotFoundError('Attendance record not found', ERROR_CODES.NOT_FOUND);
    }
    return record;
  },

  async getToday(companyId: string, employeeId: string) {
    const today = startOfDay(new Date());
    let record = await AttendanceRepository.findOne({ employeeId, date: today }, { companyId });
    if (!record) {
      record = await AttendanceCalculatorService.getOrCreateRecord(companyId, employeeId, today, 'system');
    }

    const logs = await AttendanceLogRepository.findMany(
      { attendanceId: record.id },
      { companyId },
    );
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const lastPunchType = logs[0]?.type;

    return {
      ...record,
      lastPunchType,
      onBreak: lastPunchType === ATTENDANCE_LOG_TYPE.BREAK_START,
    };
  },

  async getCalendar(companyId: string, startDate: string, endDate: string, employeeId?: string) {
    const filter: Record<string, unknown> = {
      date: { $gte: startOfDay(new Date(startDate)), $lte: endOfDay(new Date(endDate)) },
    };
    if (employeeId) filter.employeeId = employeeId;

    const records = await AttendanceRepository.findMany(filter, { companyId });
    records.sort((a, b) => a.date.getTime() - b.date.getTime());
    return records.map((r) => ({
      id: r.id,
      employeeId: r.employeeId,
      date: r.date,
      status: r.status,
      checkIn: r.checkIn,
      checkOut: r.checkOut,
      workedMinutes: r.workedMinutes,
      lateMinutes: r.lateMinutes,
      isHoliday: r.isHoliday,
      isWeekend: r.isWeekend,
    }));
  },

  async override(context: AttendanceActorContext, payload: {
    attendanceId: string;
    status?: string;
    checkIn?: Date;
    checkOut?: Date;
    notes?: string;
    reason: string;
  }) {
    const before = await this.getById(context.companyId, payload.attendanceId);

    await AttendanceRepository.update(
      payload.attendanceId,
      {
        ...(payload.status !== undefined ? { status: payload.status } : {}),
        ...(payload.checkIn !== undefined ? { checkIn: payload.checkIn } : {}),
        ...(payload.checkOut !== undefined ? { checkOut: payload.checkOut } : {}),
        ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    const recalculated = await AttendanceCalculatorService.recalculate(context.companyId, payload.attendanceId, context.userId);

    await AttendanceAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'attendance',
      entityId: payload.attendanceId,
      action: 'update',
      before: AttendanceAuditService.toRecord(before),
      after: AttendanceAuditService.toRecord(recalculated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return recalculated;
  },

  async getTeamRecords(companyId: string, managerEmployeeId: string, query: { date?: string; startDate?: string; endDate?: string }) {
    const { EmployeeRepository } = await import('@domain/employee/employee.schemas.js');
    const directReports = await EmployeeRepository.findMany(
      { reportingManagerId: managerEmployeeId },
      { companyId },
    );
    const employeeIds = directReports.map((e) => e.id);
    if (employeeIds.length === 0) {
      return [];
    }

    const filter: Record<string, unknown> = { employeeId: { $in: employeeIds } };
    if (query.date) {
      filter.date = startOfDay(new Date(query.date));
    } else if (query.startDate || query.endDate) {
      filter.date = {};
      if (query.startDate) (filter.date as Record<string, Date>).$gte = startOfDay(new Date(query.startDate));
      if (query.endDate) (filter.date as Record<string, Date>).$lte = endOfDay(new Date(query.endDate));
    } else {
      filter.date = startOfDay(new Date());
    }

    const results = await AttendanceRepository.findMany(filter, { companyId });
    results.sort((a, b) => b.date.getTime() - a.date.getTime());
    return results;
  },

  async getExceptions(companyId: string, query: { date?: string; startDate?: string; endDate?: string; departmentId?: string; branchId?: string }) {
    const filter: Record<string, unknown> = {
      $or: [
        { status: ATTENDANCE_STATUS.LATE },
        { status: ATTENDANCE_STATUS.ABSENT },
        { checkIn: { $exists: true }, checkOut: { $exists: false } },
        { checkIn: { $exists: false }, status: { $nin: [ATTENDANCE_STATUS.HOLIDAY, ATTENDANCE_STATUS.WEEKEND] } },
      ],
    };

    if (query.departmentId) filter.departmentId = query.departmentId;
    if (query.branchId) filter.branchId = query.branchId;

    if (query.date) {
      filter.date = startOfDay(new Date(query.date));
    } else {
      filter.date = {};
      const dateFilter = filter.date as Record<string, Date>;
      dateFilter.$gte = startOfDay(new Date(query.startDate ?? new Date().toISOString()));
      dateFilter.$lte = endOfDay(new Date(query.endDate ?? new Date().toISOString()));
    }

    const records = await AttendanceRepository.findMany(filter, { companyId });
    records.sort((a, b) => b.date.getTime() - a.date.getTime());
    return records.map((r) => ({
      id: r.id,
      employeeId: r.employeeId,
      date: r.date,
      status: r.status,
      checkIn: r.checkIn,
      checkOut: r.checkOut,
      lateMinutes: r.lateMinutes,
      exceptionType: !r.checkIn ? 'missing_check_in' : !r.checkOut ? 'missing_check_out' : r.status === ATTENDANCE_STATUS.LATE ? 'late' : 'absent',
    }));
  },
};
