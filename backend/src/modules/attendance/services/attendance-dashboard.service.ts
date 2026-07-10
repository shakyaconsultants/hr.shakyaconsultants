import {
  ATTENDANCE_CORRECTION_STATUS,
  AttendanceAdjustmentRepository,
  AttendanceRepository,
} from '@domain/attendance/attendance.schemas.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import { ATTENDANCE_STATUS } from '@shared/constants/status.constants.js';
import { startOfDay, endOfDay } from '@shared/utils/date.util.js';

function countByStatus(records: Array<{ status: string }>) {
  return {
    present: records.filter((r) => r.status === ATTENDANCE_STATUS.PRESENT).length,
    absent: records.filter((r) => r.status === ATTENDANCE_STATUS.ABSENT).length,
    late: records.filter((r) => r.status === ATTENDANCE_STATUS.LATE).length,
    halfDay: records.filter((r) => r.status === ATTENDANCE_STATUS.HALF_DAY).length,
    onLeave: records.filter((r) => r.status === ATTENDANCE_STATUS.ON_LEAVE).length,
    holiday: records.filter((r) => r.status === ATTENDANCE_STATUS.HOLIDAY).length,
    weekend: records.filter((r) => r.status === ATTENDANCE_STATUS.WEEKEND).length,
  };
}

function countMissingPunches(records: Array<{ checkIn?: Date; checkOut?: Date }>): number {
  return records.filter((record) => record.checkIn && !record.checkOut).length;
}

function toDashboardStats(
  statusCounts: ReturnType<typeof countByStatus>,
  options: {
    totalEmployees?: number;
    unmarkedEmployees?: number;
    pendingCorrections: number;
    missingPunches: number;
  },
) {
  const unmarked = options.unmarkedEmployees ?? 0;
  return {
    presentToday: statusCounts.present,
    absentToday: statusCounts.absent + unmarked,
    lateToday: statusCounts.late,
    onLeaveToday: statusCounts.onLeave,
    halfDayToday: statusCounts.halfDay,
    holidayToday: statusCounts.holiday,
    pendingCorrections: options.pendingCorrections,
    missingPunches: options.missingPunches,
    totalEmployees: options.totalEmployees,
  };
}

async function countPendingCorrections(companyId: string): Promise<number> {
  return AttendanceAdjustmentRepository.count(
    { status: ATTENDANCE_CORRECTION_STATUS.PENDING },
    { companyId },
  );
}

export const AttendanceDashboardService = {
  async getEnterpriseDashboard(companyId: string, date?: string) {
    const targetDate = date ? startOfDay(new Date(date)) : startOfDay(new Date());
    const [records, employees, pendingCorrections] = await Promise.all([
      AttendanceRepository.findMany({ date: targetDate }, { companyId }),
      EmployeeRepository.findMany({}, { companyId }),
      countPendingCorrections(companyId),
    ]);
    const statusCounts = countByStatus(records);
    const unmarked = Math.max(0, employees.length - records.length);

    return {
      date: targetDate,
      markedAttendance: records.length,
      unmarked,
      attendanceRate:
        employees.length > 0
          ? Math.round(
              ((statusCounts.present + statusCounts.late + statusCounts.halfDay * 0.5) /
                employees.length) *
                100,
            )
          : 0,
      ...toDashboardStats(statusCounts, {
        totalEmployees: employees.length,
        unmarkedEmployees: unmarked,
        pendingCorrections,
        missingPunches: countMissingPunches(records),
      }),
    };
  },

  async getHrDashboard(companyId: string, date?: string) {
    const targetDate = date ? startOfDay(new Date(date)) : startOfDay(new Date());
    const [records, pendingCorrections] = await Promise.all([
      AttendanceRepository.findMany({ date: targetDate }, { companyId }),
      countPendingCorrections(companyId),
    ]);
    const statusCounts = countByStatus(records);

    const byDepartment: Record<
      string,
      { present: number; absent: number; late: number; total: number }
    > = {};
    for (const record of records) {
      const dept = record.departmentId ?? 'unassigned';
      if (!(dept in byDepartment)) {
        byDepartment[dept] = { present: 0, absent: 0, late: 0, total: 0 };
      }
      const bucket = byDepartment[dept];
      bucket.total++;
      if (record.status === ATTENDANCE_STATUS.PRESENT) bucket.present++;
      if (record.status === ATTENDANCE_STATUS.ABSENT) bucket.absent++;
      if (record.status === ATTENDANCE_STATUS.LATE) bucket.late++;
    }

    const exceptions = records.filter(
      (r) =>
        r.status === ATTENDANCE_STATUS.LATE ||
        r.status === ATTENDANCE_STATUS.ABSENT ||
        (r.checkIn && !r.checkOut),
    );

    return {
      date: targetDate,
      byDepartment,
      exceptionCount: exceptions.length,
      ...toDashboardStats(statusCounts, {
        pendingCorrections,
        missingPunches: countMissingPunches(records),
      }),
    };
  },

  async getManagerDashboard(companyId: string, managerEmployeeId: string, date?: string) {
    const targetDate = date ? startOfDay(new Date(date)) : startOfDay(new Date());
    const directReports = await EmployeeRepository.findMany(
      { reportingManagerId: managerEmployeeId },
      { companyId },
    );
    const employeeIds = directReports.map((e) => e.id);

    if (employeeIds.length === 0) {
      return {
        date: targetDate,
        teamSize: 0,
        members: [],
        ...toDashboardStats(countByStatus([]), {
          pendingCorrections: 0,
          missingPunches: 0,
        }),
      };
    }

    const [records, pendingCorrections] = await Promise.all([
      AttendanceRepository.findMany(
        { employeeId: { $in: employeeIds }, date: targetDate },
        { companyId },
      ),
      countPendingCorrections(companyId),
    ]);

    const statusCounts = countByStatus(records);
    const recordMap = new Map(records.map((r) => [r.employeeId, r]));
    const unmarked = Math.max(0, directReports.length - records.length);

    const members = directReports.map((emp) => {
      const record = recordMap.get(emp.id);
      return {
        employeeId: emp.id,
        name: `${emp.firstName} ${emp.lastName}`,
        status: record?.status ?? ATTENDANCE_STATUS.ABSENT,
        checkIn: record?.checkIn,
        checkOut: record?.checkOut,
        lateMinutes: record?.lateMinutes ?? 0,
      };
    });

    return {
      date: targetDate,
      teamSize: directReports.length,
      members,
      ...toDashboardStats(statusCounts, {
        unmarkedEmployees: unmarked,
        pendingCorrections,
        missingPunches: countMissingPunches(records),
      }),
    };
  },

  async getWeeklyTrend(companyId: string) {
    const end = endOfDay(new Date());
    const start = startOfDay(new Date());
    start.setDate(start.getDate() - 6);

    const records = await AttendanceRepository.findMany(
      { date: { $gte: start, $lte: end } },
      { companyId },
    );
    records.sort((a, b) => a.date.getTime() - b.date.getTime());

    const byDate: Record<string, ReturnType<typeof countByStatus>> = {};
    for (const record of records) {
      const key = record.date.toISOString().slice(0, 10);
      if (!(key in byDate)) {
        byDate[key] = countByStatus([]);
      }
      const bucket = byDate[key];
      if (record.status === ATTENDANCE_STATUS.PRESENT) bucket.present++;
      if (record.status === ATTENDANCE_STATUS.ABSENT) bucket.absent++;
      if (record.status === ATTENDANCE_STATUS.LATE) bucket.late++;
      if (record.status === ATTENDANCE_STATUS.HALF_DAY) bucket.halfDay++;
      if (record.status === ATTENDANCE_STATUS.ON_LEAVE) bucket.onLeave++;
      if (record.status === ATTENDANCE_STATUS.HOLIDAY) bucket.holiday++;
      if (record.status === ATTENDANCE_STATUS.WEEKEND) bucket.weekend++;
    }

    return { start, end, byDate };
  },
};
