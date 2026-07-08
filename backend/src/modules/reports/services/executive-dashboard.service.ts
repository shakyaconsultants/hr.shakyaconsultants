import {
  EmployeeRepository,
  EMPLOYEE_EMPLOYMENT_STATUS,
} from '@domain/employee/employee.schemas.js';
import { DepartmentRepository } from '@domain/organization/organization.schemas.js';
import { ProjectRepository } from '@domain/project/project.schemas.js';
import { CandidateLeadRepository } from '@domain/recruitment/recruitment.schemas.js';
import {
  ApprovalRequestRepository,
  APPROVAL_REQUEST_STATUS,
} from '@domain/approval/approval.schemas.js';
import { AuditLogRepository, LoginHistoryRepository } from '@domain/audit/audit.schemas.js';
import { PIPELINE_STAGE } from '@domain/recruitment/recruitment-extended.schemas.js';
import { PROJECT_STATUS } from '@shared/constants/status.constants.js';
import { MONGODB_HEALTH } from '@shared/constants/health.constants.js';
import { getMongoConnectionState } from '@infrastructure/database/mongodb.connection.js';
import { SystemAdminService } from '@modules/settings/services/system-admin.service.js';
import { AttendanceDashboardService } from '@modules/attendance/services/attendance-dashboard.service.js';
import { PayrollDashboardService } from '@modules/payroll/services/payroll-dashboard.service.js';
import { SalesDashboardService } from '@modules/sales/services/sales-dashboard.service.js';
import type { ReportFilters } from '@modules/reports/types/reports.types.js';

function getMongoHealthStatus(): typeof MONGODB_HEALTH.HEALTHY | typeof MONGODB_HEALTH.UNHEALTHY {
  return getMongoConnectionState() === 1 ? MONGODB_HEALTH.HEALTHY : MONGODB_HEALTH.UNHEALTHY;
}

export const ExecutiveDashboardService = {
  async getOverview(companyId: string, filters: ReportFilters = {}) {
    const [
      employees,
      departments,
      projects,
      candidates,
      attendanceToday,
      payrollStatus,
      salesPerformance,
      pendingApprovals,
      systemHealth,
      queueStatus,
      recentAuditEvents,
      recentLoginEvents,
    ] = await Promise.all([
      EmployeeRepository.findMany({}, { companyId }),
      DepartmentRepository.findMany({}, { companyId }),
      ProjectRepository.findMany({ isArchived: false }, { companyId }),
      CandidateLeadRepository.findMany({ isArchived: false }, { companyId }),
      AttendanceDashboardService.getEnterpriseDashboard(companyId, filters.startDate),
      PayrollDashboardService.getEnterpriseDashboard(companyId, {
        year: filters.year,
        month: filters.month,
      }),
      SalesDashboardService.getEnterpriseDashboard(companyId, {
        startDate: filters.startDate,
        endDate: filters.endDate,
      }),
      ApprovalRequestRepository.count({ status: APPROVAL_REQUEST_STATUS.PENDING }, { companyId }),
      Promise.resolve(this.getSystemHealth()),
      Promise.resolve('direct' as const),
      AuditLogRepository.findMany({}, { companyId }),
      LoginHistoryRepository.findMany({ success: false }, { companyId }),
    ]);

    const activeEmployees = employees.filter(
      (e) =>
        e.employmentStatus !== EMPLOYEE_EMPLOYMENT_STATUS.TERMINATED &&
        e.employmentStatus !== EMPLOYEE_EMPLOYMENT_STATUS.RESIGNED,
    );

    const openPositions = new Set(
      candidates
        .filter(
          (c): c is (typeof candidates)[number] & { designationId: string } =>
            c.pipelineStage !== PIPELINE_STAGE.EMPLOYEE_CONVERTED &&
            c.pipelineStage !== PIPELINE_STAGE.REJECTED &&
            Boolean(c.designationId),
        )
        .map((c) => c.designationId),
    ).size;

    const sortedAudit = recentAuditEvents
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10)
      .map((e) => ({
        id: e.id,
        action: e.action,
        entityType: e.entityType,
        entityId: e.entityId,
        createdAt: e.createdAt,
      }));

    const sortedLogins = recentLoginEvents
      .sort((a, b) => b.loggedInAt.getTime() - a.loggedInAt.getTime())
      .slice(0, 5)
      .map((e) => ({
        id: e.id,
        userId: e.userId,
        success: e.success,
        failureReason: e.failureReason,
        loggedInAt: e.loggedInAt,
      }));

    return {
      workforce: {
        totalEmployees: employees.length,
        activeEmployees: activeEmployees.length,
        departmentsCount: departments.length,
      },
      projects: {
        total: projects.length,
        active: projects.filter((p) => p.status === PROJECT_STATUS.ACTIVE).length,
      },
      recruitment: {
        candidatesCount: candidates.length,
        openPositions,
      },
      attendanceToday: {
        present: attendanceToday.present,
        absent: attendanceToday.absent,
        onLeave: attendanceToday.onLeave,
        attendanceRate: attendanceToday.attendanceRate,
        employeesOnLeave: attendanceToday.onLeave,
      },
      payrollStatus: {
        pendingApproval: payrollStatus.pendingApproval,
        lockedRuns: payrollStatus.lockedRuns,
        totalNet: payrollStatus.totalNet,
        recentRuns: payrollStatus.recentRuns,
      },
      salesPerformance: {
        totalLeads: salesPerformance.totalLeads,
        openDeals: salesPerformance.openDeals,
        pipelineValue: salesPerformance.pipelineValue,
        revenue: salesPerformance.revenue,
      },
      pendingApprovals,
      systemHealth,
      queueStatus,
      recentEvents: {
        audit: sortedAudit,
        security: sortedLogins,
      },
    };
  },

  getSystemHealth() {
    const mongodb = getMongoHealthStatus();
    const email = SystemAdminService.getEmailDeliveryStatus().configured
      ? 'direct'
      : 'unconfigured';
    return { mongodb, email };
  },
};
