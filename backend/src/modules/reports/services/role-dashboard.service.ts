import { ExecutiveDashboardService } from '@modules/reports/services/executive-dashboard.service.js';
import { HrAnalyticsService } from '@modules/reports/services/hr-analytics.service.js';
import { AttendanceDashboardService } from '@modules/attendance/services/attendance-dashboard.service.js';
import { PayrollDashboardService } from '@modules/payroll/services/payroll-dashboard.service.js';
import { SalesDashboardService } from '@modules/sales/services/sales-dashboard.service.js';
import { ProjectDashboardService } from '@modules/project/services/project-dashboard.service.js';
import { RecruitmentDashboardService } from '@modules/recruitment/services/recruitment-dashboard.service.js';
import { EXECUTIVE_ROLE } from '@modules/reports/constants/reports.constants.js';
import type { ExecutiveRole, ReportFilters } from '@modules/reports/types/reports.types.js';

export const RoleDashboardService = {
  async getDashboard(companyId: string, role: ExecutiveRole, filters: ReportFilters = {}) {
    const overview = await ExecutiveDashboardService.getOverview(companyId, filters);

    switch (role) {
      case EXECUTIVE_ROLE.CEO:
        return {
          role,
          overview,
          highlights: {
            workforce: overview.workforce,
            sales: overview.salesPerformance,
            payroll: overview.payrollStatus,
            attendance: overview.attendanceToday,
          },
        };

      case EXECUTIVE_ROLE.HR_HEAD:
        return {
          role,
          overview: {
            workforce: overview.workforce,
            recruitment: overview.recruitment,
            pendingApprovals: overview.pendingApprovals,
          },
          hrAnalytics: await this.getHrBundle(companyId, filters),
          attendance: overview.attendanceToday,
          recruitment: await RecruitmentDashboardService.getDashboard(companyId),
        };

      case EXECUTIVE_ROLE.FINANCE_HEAD:
        return {
          role,
          payroll: await PayrollDashboardService.getFinanceDashboard(companyId, {
            year: filters.year,
            month: filters.month,
          }),
          payrollSummary: overview.payrollStatus,
          salesRevenue: overview.salesPerformance.revenue,
        };

      case EXECUTIVE_ROLE.PROJECT_HEAD:
        return {
          role,
          projects: overview.projects,
          projectDashboard: await ProjectDashboardService.getManagerDashboard(companyId),
        };

      case EXECUTIVE_ROLE.SALES_HEAD:
        return {
          role,
          sales: await SalesDashboardService.getEnterpriseDashboard(companyId, {
            startDate: filters.startDate,
            endDate: filters.endDate,
          }),
          pipeline: overview.salesPerformance,
        };

      case EXECUTIVE_ROLE.OPERATIONS_HEAD:
        return {
          role,
          attendance: await AttendanceDashboardService.getHrDashboard(companyId, filters.startDate),
          attendanceTrend: await AttendanceDashboardService.getWeeklyTrend(companyId),
          pendingApprovals: overview.pendingApprovals,
          systemHealth: overview.systemHealth,
          queueStatus: overview.queueStatus,
        };

      default:
        return { role, overview };
    }
  },

  async getHrBundle(companyId: string, filters: ReportFilters) {
    const [
      employeeGrowth,
      departmentStrength,
      hiringFunnel,
      leaveAnalytics,
      attrition,
    ] = await Promise.all([
      HrAnalyticsService.employeeGrowth(companyId, filters),
      HrAnalyticsService.departmentStrength(companyId, filters),
      HrAnalyticsService.hiringFunnel(companyId),
      HrAnalyticsService.leaveAnalytics(companyId, filters),
      HrAnalyticsService.attrition(companyId, filters),
    ]);

    return { employeeGrowth, departmentStrength, hiringFunnel, leaveAnalytics, attrition };
  },
};
