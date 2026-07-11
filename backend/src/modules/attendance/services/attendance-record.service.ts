import {
  ATTENDANCE_LOG_TYPE,
  AttendanceLogRepository,
  AttendanceRepository,
} from '@domain/attendance/attendance.schemas.js';
import {
  EMPLOYEE_EMPLOYMENT_STATUS,
  EmployeeRepository,
} from '@domain/employee/employee.schemas.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { startOfDay, endOfDay } from '@shared/utils/date.util.js';
import { toPlainDocument } from '@infrastructure/database/document.util.js';
import { AttendanceCalculatorService } from '@modules/attendance/services/attendance-calculator.service.js';
import { AttendanceDayStatusService } from '@modules/attendance/services/attendance-day-status.service.js';
import { AttendanceDailySummaryService } from '@modules/attendance/services/attendance-daily-summary.service.js';
import { AttendancePolicyService } from '@modules/attendance/services/attendance-policy.service.js';
import { HolidayResolverService } from '@modules/organization/services/holiday-resolver.service.js';
import { AttendanceAuditService } from '@modules/attendance/services/attendance-audit.service.js';
import type { AttendanceActorContext } from '@modules/approval/types/approval.types.js';
import { ATTENDANCE_STATUS } from '@shared/constants/status.constants.js';

function toLocalDateKey(date: Date): string {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const AttendanceRecordService = {
  async list(
    companyId: string,
    query: {
      page?: number;
      pageSize?: number;
      employeeId?: string;
      departmentId?: string;
      branchId?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const filter: Record<string, unknown> = {};
    if (query.employeeId) filter.employeeId = query.employeeId;
    if (query.departmentId) filter.departmentId = query.departmentId;
    if (query.branchId) filter.branchId = query.branchId;
    if (query.status) filter.status = query.status;
    if (query.startDate || query.endDate) {
      filter.date = {};
      if (query.startDate)
        (filter.date as Record<string, Date>).$gte = startOfDay(new Date(query.startDate));
      if (query.endDate)
        (filter.date as Record<string, Date>).$lte = endOfDay(new Date(query.endDate));
    }

    const result = await AttendanceRepository.paginate(
      filter,
      {
        page: query.page,
        pageSize: query.pageSize,
        sortBy: 'date',
        sortOrder: 'desc',
      },
      { companyId },
    );

    const employeeIds = [...new Set(result.items.map((item) => item.employeeId))];
    const employees =
      employeeIds.length > 0
        ? await EmployeeRepository.findMany({ id: { $in: employeeIds } }, { companyId })
        : [];
    const employeeById = new Map(
      employees.map((employee) => [
        employee.id,
        {
          employeeName: `${employee.firstName} ${employee.lastName}`.trim(),
          employeeNumber: employee.employeeNumber,
        },
      ]),
    );

    return {
      ...result,
      items: result.items.map((item) => {
        const employee = employeeById.get(item.employeeId);
        return {
          ...toPlainDocument(item),
          employeeName: employee?.employeeName ?? null,
          employeeNumber: employee?.employeeNumber ?? null,
        };
      }),
    };
  },

  async getDailyRegister(
    companyId: string,
    query: {
      date: string;
      search?: string;
      departmentId?: string;
      branchId?: string;
      page?: number;
      pageSize?: number;
    },
  ) {
    const targetDate = startOfDay(new Date(query.date));
    const employeeFilter: Record<string, unknown> = {
      status: ENTITY_STATUS.ACTIVE,
      isDeleted: false,
      employmentStatus: {
        $nin: [EMPLOYEE_EMPLOYMENT_STATUS.TERMINATED, EMPLOYEE_EMPLOYMENT_STATUS.RESIGNED],
      },
    };
    if (query.departmentId) {
      employeeFilter.departmentId = query.departmentId;
    }
    if (query.branchId) {
      employeeFilter.branchId = query.branchId;
    }

    const [employees, records] = await Promise.all([
      EmployeeRepository.findMany(employeeFilter, { companyId }),
      AttendanceRepository.findMany({ date: targetDate }, { companyId }),
    ]);

    const recordByEmployeeId = new Map(records.map((record) => [record.employeeId, record]));
    const searchTerm = query.search?.trim().toLowerCase();

    let filtered = employees;
    if (searchTerm) {
      filtered = employees.filter((employee) => {
        const name = `${employee.firstName} ${employee.lastName}`.trim().toLowerCase();
        return (
          name.includes(searchTerm) ||
          employee.employeeNumber.toLowerCase().includes(searchTerm) ||
          employee.email.toLowerCase().includes(searchTerm)
        );
      });
    }

    filtered.sort((a, b) =>
      `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`),
    );

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const pageItems = filtered.slice(start, start + pageSize);

    const items = await Promise.all(
      pageItems.map(async (employee) => {
        const record = recordByEmployeeId.get(employee.id);
        const dayFlags = await AttendanceDayStatusService.getDayFlags(companyId, targetDate, {
          branchId: employee.branchId,
          departmentId: employee.departmentId,
        });
        const status = AttendanceDayStatusService.resolveDisplayStatus(record, dayFlags);

        return {
          id: employee.id,
          employeeId: employee.id,
          employeeNumber: employee.employeeNumber,
          employeeName: `${employee.firstName} ${employee.lastName}`.trim(),
          departmentId: employee.departmentId,
          date: targetDate,
          status,
          checkIn: record?.checkIn ?? null,
          checkOut: record?.checkOut ?? null,
          workedMinutes: record?.workedMinutes ?? null,
          lateMinutes: record?.lateMinutes ?? null,
          attendanceId: record?.id ?? null,
        };
      }),
    );

    return {
      date: targetDate,
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  },

  async getById(companyId: string, id: string) {
    const record = await AttendanceRepository.findById(id, { companyId });
    if (!record) {
      throw new NotFoundError('Attendance record not found', ERROR_CODES.NOT_FOUND);
    }
    return record;
  },

  async getToday(companyId: string, employeeId: string) {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    let record = await AttendanceRepository.findOne(
      { employeeId, date: todayStart },
      { companyId },
    );

    const todayLogs = await AttendanceLogRepository.findMany(
      {
        employeeId,
        timestamp: { $gte: todayStart, $lte: todayEnd },
      },
      { companyId },
    );

    if (!record && todayLogs.length > 0) {
      todayLogs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      record = await AttendanceRepository.findById(todayLogs[0].attendanceId, { companyId });
    }

    if (!record) {
      record = await AttendanceCalculatorService.getOrCreateRecord(
        companyId,
        employeeId,
        todayStart,
        'system',
      );
    }

    let logs = await AttendanceLogRepository.findMany({ attendanceId: record.id }, { companyId });

    if (logs.length === 0 && todayLogs.length > 0) {
      todayLogs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      const linked = await AttendanceRepository.findById(todayLogs[0].attendanceId, { companyId });
      if (linked) {
        record = linked;
        logs = todayLogs;
      }
    }

    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const lastPunchType = logs[0]?.type;

    if (logs.length > 0 && !record.checkIn) {
      record = await AttendanceCalculatorService.recalculate(companyId, record.id, 'system');
    }

    const plain = toPlainDocument(record);

    return {
      ...plain,
      lastPunchType,
      onBreak: lastPunchType === ATTENDANCE_LOG_TYPE.BREAK_START,
      logs: logs.map((log) => ({
        id: log.id,
        type: log.type,
        timestamp: log.timestamp,
        source: log.source ?? 'manual',
        deviceCode: log.deviceCode,
      })),
    };
  },

  async getCalendar(companyId: string, startDate: string, endDate: string, employeeId?: string) {
    const rangeStart = startOfDay(new Date(startDate));
    const rangeEnd = startOfDay(new Date(endDate));
    const rangeEndInclusive = endOfDay(new Date(endDate));

    const activeEmployeeFilter: Record<string, unknown> = {
      status: ENTITY_STATUS.ACTIVE,
      isDeleted: false,
      employmentStatus: {
        $nin: [EMPLOYEE_EMPLOYMENT_STATUS.TERMINATED, EMPLOYEE_EMPLOYMENT_STATUS.RESIGNED],
      },
    };

    const [records, policies, employees] = await Promise.all([
      AttendanceRepository.findMany(
        {
          date: { $gte: rangeStart, $lte: rangeEndInclusive },
          ...(employeeId ? { employeeId } : {}),
        },
        { companyId },
      ),
      AttendancePolicyService.getPolicies(companyId),
      employeeId
        ? EmployeeRepository.findMany({ id: employeeId, ...activeEmployeeFilter }, { companyId })
        : EmployeeRepository.findMany(activeEmployeeFilter, { companyId }),
    ]);

    let targetEmployees = employees;
    if (employeeId && targetEmployees.length === 0) {
      const employee = await EmployeeRepository.findById(employeeId, { companyId });
      if (employee) {
        targetEmployees = [employee];
      }
    }

    targetEmployees.sort((a, b) =>
      `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`),
    );

    const recordByEmployeeAndDate = new Map<string, (typeof records)[number]>();
    for (const record of records) {
      const key = `${record.employeeId}:${toLocalDateKey(record.date)}`;
      recordByEmployeeAndDate.set(key, record);
    }

    const resolveFlags = async (
      date: Date,
      scope: { branchId?: string; departmentId?: string },
    ) => {
      const isWeekend = policies.weeklyOffDays.includes(date.getDay());
      const holiday = await HolidayResolverService.findHoliday(companyId, date, scope);
      return { isWeekend, isHoliday: Boolean(holiday) };
    };

    const buildEntry = async (
      employee: (typeof targetEmployees)[number],
      date: Date,
      record?: (typeof records)[number],
    ) => {
      const dayFlags = await resolveFlags(date, {
        branchId: employee.branchId,
        departmentId: employee.departmentId,
      });
      const status = AttendanceDayStatusService.resolveDisplayStatus(record, dayFlags);
      const employeeName =
        `${employee.firstName} ${employee.lastName}`.trim() || employee.employeeNumber;

      return {
        id: record?.id,
        employeeId: employee.id,
        employeeName,
        employeeNumber: employee.employeeNumber,
        date: startOfDay(date),
        status,
        checkIn: record?.checkIn,
        checkOut: record?.checkOut,
        workedMinutes: record?.workedMinutes,
        lateMinutes: record?.lateMinutes,
        isHoliday: dayFlags.isHoliday,
        isWeekend: dayFlags.isWeekend,
      };
    };

    const items: Awaited<ReturnType<typeof buildEntry>>[] = [];
    const cursor = new Date(rangeStart);

    if (!employeeId) {
      return items;
    }

    while (cursor <= rangeEnd) {
      const day = startOfDay(cursor);

      for (const employee of targetEmployees) {
        const record = recordByEmployeeAndDate.get(`${employee.id}:${toLocalDateKey(day)}`);
        items.push(await buildEntry(employee, day, record));
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    return items;
  },

  async getCalendarSummary(companyId: string, startDate: string, endDate: string) {
    return AttendanceDailySummaryService.getSummariesForRange(companyId, startDate, endDate);
  },

  async override(
    context: AttendanceActorContext,
    payload: {
      attendanceId: string;
      status?: string;
      checkIn?: Date;
      checkOut?: Date;
      notes?: string;
      reason: string;
    },
  ) {
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

    const recalculated = await AttendanceCalculatorService.recalculate(
      context.companyId,
      payload.attendanceId,
      context.userId,
    );

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

  async getTeamRecords(
    companyId: string,
    managerEmployeeId: string,
    query: { date?: string; startDate?: string; endDate?: string },
  ) {
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
      if (query.startDate)
        (filter.date as Record<string, Date>).$gte = startOfDay(new Date(query.startDate));
      if (query.endDate)
        (filter.date as Record<string, Date>).$lte = endOfDay(new Date(query.endDate));
    } else {
      filter.date = startOfDay(new Date());
    }

    const results = await AttendanceRepository.findMany(filter, { companyId });
    results.sort((a, b) => b.date.getTime() - a.date.getTime());
    return results;
  },

  async getExceptions(
    companyId: string,
    query: {
      date?: string;
      startDate?: string;
      endDate?: string;
      departmentId?: string;
      branchId?: string;
    },
  ) {
    const filter: Record<string, unknown> = {
      $or: [
        { status: ATTENDANCE_STATUS.LATE },
        { status: ATTENDANCE_STATUS.ABSENT },
        { checkIn: { $exists: true }, checkOut: { $exists: false } },
        {
          checkIn: { $exists: false },
          status: { $nin: [ATTENDANCE_STATUS.HOLIDAY, ATTENDANCE_STATUS.WEEKEND] },
        },
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
      exceptionType: !r.checkIn
        ? 'missing_check_in'
        : !r.checkOut
          ? 'missing_check_out'
          : r.status === ATTENDANCE_STATUS.LATE
            ? 'late'
            : 'absent',
    }));
  },
};
