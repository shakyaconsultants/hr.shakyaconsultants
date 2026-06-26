import { AttendanceRepository } from '@domain/attendance/attendance.schemas.js';
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

export const AttendanceDashboardService = {
  async getEnterpriseDashboard(companyId: string, date?: string) {
    const targetDate = date ? startOfDay(new Date(date)) : startOfDay(new Date());
    const records = await AttendanceRepository.findMany({ date: targetDate }, { companyId });
    const employees = await EmployeeRepository.findMany({}, { companyId });
    const statusCounts = countByStatus(records);

    return {
      date: targetDate,
      totalEmployees: employees.length,
      markedAttendance: records.length,
      unmarked: Math.max(0, employees.length - records.length),
      ...statusCounts,
      attendanceRate: employees.length > 0
        ? Math.round(((statusCounts.present + statusCounts.late + statusCounts.halfDay * 0.5) / employees.length) * 100)
        : 0,
    };
  },

  async getHrDashboard(companyId: string, date?: string) {
    const targetDate = date ? startOfDay(new Date(date)) : startOfDay(new Date());
    const records = await AttendanceRepository.findMany({ date: targetDate }, { companyId });
    const statusCounts = countByStatus(records);

    const byDepartment: Record<string, { present: number; absent: number; late: number; total: number }> = {};
    for (const record of records) {
      const dept = record.departmentId ?? 'unassigned';
      if (!byDepartment[dept]) {
        byDepartment[dept] = { present: 0, absent: 0, late: 0, total: 0 };
      }
      byDepartment[dept].total++;
      if (record.status === ATTENDANCE_STATUS.PRESENT) byDepartment[dept].present++;
      if (record.status === ATTENDANCE_STATUS.ABSENT) byDepartment[dept].absent++;
      if (record.status === ATTENDANCE_STATUS.LATE) byDepartment[dept].late++;
    }

    const exceptions = records.filter(
      (r) => r.status === ATTENDANCE_STATUS.LATE
        || r.status === ATTENDANCE_STATUS.ABSENT
        || (r.checkIn && !r.checkOut),
    );

    return {
      date: targetDate,
      ...statusCounts,
      byDepartment,
      exceptionCount: exceptions.length,
      pendingCorrections: 0,
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
      return { date: targetDate, teamSize: 0, present: 0, absent: 0, late: 0, members: [] };
    }

    const records = await AttendanceRepository.findMany(
      { employeeId: { $in: employeeIds }, date: targetDate },
      { companyId },
    );

    const statusCounts = countByStatus(records);
    const recordMap = new Map(records.map((r) => [r.employeeId, r]));

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
      ...statusCounts,
      members,
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
      if (!byDate[key]) byDate[key] = countByStatus([]);
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
