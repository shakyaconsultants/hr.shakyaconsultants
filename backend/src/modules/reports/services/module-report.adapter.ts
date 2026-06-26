import { AttendanceReportService } from '@modules/attendance/services/report.service.js';
import { AttendanceDashboardService } from '@modules/attendance/services/attendance-dashboard.service.js';
import { PayrollReportService } from '@modules/payroll/services/payroll-report.service.js';
import { PayrollDashboardService } from '@modules/payroll/services/payroll-dashboard.service.js';
import { SalesReportService } from '@modules/sales/services/sales-report.service.js';
import { SalesDashboardService } from '@modules/sales/services/sales-dashboard.service.js';
import { ProjectDashboardService } from '@modules/project/services/project-dashboard.service.js';
import { RecruitmentDashboardService } from '@modules/recruitment/services/recruitment-dashboard.service.js';
import { CommunicationReportService } from '@modules/communication/services/communication-report.service.js';
import { HrAnalyticsService } from '@modules/reports/services/hr-analytics.service.js';
import {
  REPORT_DOMAIN,
  HR_REPORT_TYPE,
  ATTENDANCE_DELEGATED_REPORT_TYPE,
  PROJECT_DELEGATED_REPORT_TYPE,
  RECRUITMENT_DELEGATED_REPORT_TYPE,
} from '@modules/reports/constants/reports.constants.js';
import { ATTENDANCE_REPORT_PERIOD, ATTENDANCE_REPORT_SCOPE } from '@modules/attendance/constants/attendance.constants.js';
import type { ReportFilters, ReportRequest } from '@modules/reports/types/reports.types.js';

function buildAttendanceQuery(filters: ReportFilters) {
  return {
    period: filters.period ?? ATTENDANCE_REPORT_PERIOD.MONTHLY,
    scope: filters.scope ?? ATTENDANCE_REPORT_SCOPE.COMPANY,
    startDate: filters.startDate ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    endDate: filters.endDate ?? new Date().toISOString().slice(0, 10),
    employeeId: filters.employeeId,
    departmentId: filters.departmentId,
    branchId: filters.branchId,
  };
}

export const ModuleReportAdapter = {
  async generate(companyId: string, request: ReportRequest) {
    const filters = request.filters ?? {};

    switch (request.domain) {
      case REPORT_DOMAIN.HR:
        return HrAnalyticsService.generate(companyId, request.type, filters);

      case REPORT_DOMAIN.ATTENDANCE:
        if (request.type === ATTENDANCE_DELEGATED_REPORT_TYPE.WEEKLY_TREND) {
          return AttendanceDashboardService.getWeeklyTrend(companyId);
        }
        if (request.type === ATTENDANCE_DELEGATED_REPORT_TYPE.ENTERPRISE_DASHBOARD) {
          return AttendanceDashboardService.getEnterpriseDashboard(companyId, filters.startDate);
        }
        return AttendanceReportService.generate(companyId, buildAttendanceQuery(filters));

      case REPORT_DOMAIN.FINANCE:
        return PayrollReportService.generate(companyId, {
          type: request.type,
          year: filters.year,
          month: filters.month,
          departmentId: filters.departmentId,
          branchId: filters.branchId,
          startDate: filters.startDate,
          endDate: filters.endDate,
        });

      case REPORT_DOMAIN.SALES:
        return SalesReportService.generate(companyId, {
          type: request.type,
          startDate: filters.startDate,
          endDate: filters.endDate,
          employeeId: filters.employeeId,
        });

      case REPORT_DOMAIN.PROJECT:
        if (request.type === PROJECT_DELEGATED_REPORT_TYPE.MANAGER_DASHBOARD) {
          return ProjectDashboardService.getManagerDashboard(companyId);
        }
        return ProjectDashboardService.getProjectDashboard(companyId, filters.projectId);

      case REPORT_DOMAIN.EXECUTIVE:
        if (request.type === RECRUITMENT_DELEGATED_REPORT_TYPE.DASHBOARD) {
          return RecruitmentDashboardService.getDashboard(companyId);
        }
        if (request.type === 'payroll_dashboard') {
          return PayrollDashboardService.getEnterpriseDashboard(companyId, {
            year: filters.year,
            month: filters.month,
          });
        }
        if (request.type === 'sales_dashboard') {
          return SalesDashboardService.getEnterpriseDashboard(companyId, {
            startDate: filters.startDate,
            endDate: filters.endDate,
          });
        }
        return AttendanceDashboardService.getEnterpriseDashboard(companyId, filters.startDate);

      case REPORT_DOMAIN.SYSTEM:
        if (request.type === 'communication') {
          return CommunicationReportService.generate(companyId, {
            type: filters.type ?? 'reach',
            startDate: filters.startDate,
            endDate: filters.endDate,
            employeeId: filters.employeeId,
          });
        }
        return { message: 'System report type not configured', type: request.type };

      default:
        return HrAnalyticsService.generate(companyId, request.type, filters);
    }
  },

  async exportCsv(companyId: string, request: ReportRequest): Promise<string | null> {
    const filters = request.filters ?? {};

    switch (request.domain) {
      case REPORT_DOMAIN.ATTENDANCE:
        return AttendanceReportService.exportCsv(companyId, buildAttendanceQuery(filters));
      case REPORT_DOMAIN.FINANCE:
        return PayrollReportService.exportCsv(companyId, {
          type: request.type,
          year: filters.year,
          month: filters.month,
          departmentId: filters.departmentId,
          branchId: filters.branchId,
        });
      case REPORT_DOMAIN.SALES:
        return SalesReportService.exportCsv(companyId, {
          type: request.type,
          startDate: filters.startDate,
          endDate: filters.endDate,
          employeeId: filters.employeeId,
        });
      case REPORT_DOMAIN.SYSTEM:
        return CommunicationReportService.exportCsv(companyId, {
          type: filters.type ?? request.type,
          startDate: filters.startDate,
          endDate: filters.endDate,
        });
      default:
        return null;
    }
  },

  async exportHtml(companyId: string, request: ReportRequest): Promise<string | null> {
    const filters = request.filters ?? {};
    if (request.domain === REPORT_DOMAIN.SALES) {
      return SalesReportService.exportHtml(companyId, {
        type: request.type,
        startDate: filters.startDate,
        endDate: filters.endDate,
        employeeId: filters.employeeId,
      });
    }
    return null;
  },

  supportsHrType(type: string): boolean {
    return Object.values(HR_REPORT_TYPE).includes(type as typeof HR_REPORT_TYPE[keyof typeof HR_REPORT_TYPE]);
  },
};
