import { AttendanceRepository } from '@domain/attendance/attendance.schemas.js';
import { ATTENDANCE_STATUS } from '@shared/constants/status.constants.js';
import { startOfDay, endOfDay } from '@shared/utils/date.util.js';
import { ATTENDANCE_REPORT_SCOPE } from '@modules/attendance/constants/attendance.constants.js';

interface ReportQuery {
  period: string;
  scope: string;
  startDate: string;
  endDate: string;
  employeeId?: string;
  departmentId?: string;
  branchId?: string;
}

function buildScopeFilter(query: ReportQuery): Record<string, unknown> {
  const filter: Record<string, unknown> = {
    date: { $gte: startOfDay(new Date(query.startDate)), $lte: endOfDay(new Date(query.endDate)) },
  };

  if (query.scope === ATTENDANCE_REPORT_SCOPE.EMPLOYEE && query.employeeId) {
    filter.employeeId = query.employeeId;
  }
  if (query.scope === ATTENDANCE_REPORT_SCOPE.DEPARTMENT && query.departmentId) {
    filter.departmentId = query.departmentId;
  }
  if (query.scope === ATTENDANCE_REPORT_SCOPE.BRANCH && query.branchId) {
    filter.branchId = query.branchId;
  }

  return filter;
}

function aggregateRecords(records: Array<{
  status: string;
  workedMinutes?: number;
  lateMinutes?: number;
  overtimeMinutes?: number;
  employeeId: string;
  departmentId?: string;
  branchId?: string;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
}>) {
  const summary = {
    totalRecords: records.length,
    present: 0,
    absent: 0,
    late: 0,
    halfDay: 0,
    onLeave: 0,
    holiday: 0,
    weekend: 0,
    totalWorkedMinutes: 0,
    totalLateMinutes: 0,
    totalOvertimeMinutes: 0,
  };

  for (const record of records) {
    switch (record.status) {
      case ATTENDANCE_STATUS.PRESENT: summary.present++; break;
      case ATTENDANCE_STATUS.ABSENT: summary.absent++; break;
      case ATTENDANCE_STATUS.LATE: summary.late++; break;
      case ATTENDANCE_STATUS.HALF_DAY: summary.halfDay++; break;
      case ATTENDANCE_STATUS.ON_LEAVE: summary.onLeave++; break;
      case ATTENDANCE_STATUS.HOLIDAY: summary.holiday++; break;
      case ATTENDANCE_STATUS.WEEKEND: summary.weekend++; break;
      default: break;
    }
    summary.totalWorkedMinutes += record.workedMinutes ?? 0;
    summary.totalLateMinutes += record.lateMinutes ?? 0;
    summary.totalOvertimeMinutes += record.overtimeMinutes ?? 0;
  }

  return { summary, records };
}

export const AttendanceReportService = {
  async generate(companyId: string, query: ReportQuery) {
    const filter = buildScopeFilter(query);
    const records = await AttendanceRepository.findMany(filter, { companyId });
    records.sort((a, b) => a.date.getTime() - b.date.getTime());

    return {
      period: query.period,
      scope: query.scope,
      startDate: query.startDate,
      endDate: query.endDate,
      ...aggregateRecords(records),
    };
  },

  async exportCsv(companyId: string, query: ReportQuery): Promise<string> {
    const report = await this.generate(companyId, query);
    const headers = ['employeeId', 'date', 'status', 'checkIn', 'checkOut', 'workedMinutes', 'lateMinutes', 'overtimeMinutes', 'departmentId', 'branchId'];
    const rows = report.records.map((r) => [
      r.employeeId,
      r.date.toISOString().slice(0, 10),
      r.status,
      r.checkIn?.toISOString() ?? '',
      r.checkOut?.toISOString() ?? '',
      String(r.workedMinutes ?? 0),
      String(r.lateMinutes ?? 0),
      String(r.overtimeMinutes ?? 0),
      r.departmentId ?? '',
      r.branchId ?? '',
    ].join(','));

    return [headers.join(','), ...rows].join('\n');
  },
};
