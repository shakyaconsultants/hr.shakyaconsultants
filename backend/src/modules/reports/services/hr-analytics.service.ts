import { EmployeeRepository, EMPLOYEE_EMPLOYMENT_STATUS } from '@domain/employee/employee.schemas.js';
import { DepartmentRepository } from '@domain/organization/organization.schemas.js';
import { LeaveRequestRepository } from '@domain/leave-exit/leave-exit.schemas.js';
import { ResignationRepository, LEAVE_REQUEST_STATUS } from '@domain/leave-exit/leave-exit.schemas.js';
import { OfferLetterRepository, OFFER_STATUS } from '@domain/recruitment/recruitment.schemas.js';
import { InterviewRepository } from '@domain/recruitment/recruitment.schemas.js';
import { INTERVIEW_STATUS } from '@shared/constants/status.constants.js';
import { RESIGNATION_STATUS } from '@domain/leave-exit/leave-exit.schemas.js';
import { RecruitmentDashboardService } from '@modules/recruitment/services/recruitment-dashboard.service.js';
import { HR_REPORT_TYPE } from '@modules/reports/constants/reports.constants.js';
import type { ReportFilters } from '@modules/reports/types/reports.types.js';

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function applyDateFilter<T extends { createdAt: Date }>(
  items: T[],
  filters: ReportFilters,
): T[] {
  let result = items;
  if (filters.startDate) {
    const start = new Date(filters.startDate);
    result = result.filter((i) => i.createdAt >= start);
  }
  if (filters.endDate) {
    const end = new Date(filters.endDate);
    end.setHours(23, 59, 59, 999);
    result = result.filter((i) => i.createdAt <= end);
  }
  return result;
}

export const HrAnalyticsService = {
  async generate(companyId: string, type: string, filters: ReportFilters = {}) {
    switch (type) {
      case HR_REPORT_TYPE.EMPLOYEE_GROWTH:
        return this.employeeGrowth(companyId, filters);
      case HR_REPORT_TYPE.DEPARTMENT_STRENGTH:
        return this.departmentStrength(companyId, filters);
      case HR_REPORT_TYPE.HIRING_FUNNEL:
        return this.hiringFunnel(companyId);
      case HR_REPORT_TYPE.INTERVIEW_STATS:
        return this.interviewStats(companyId, filters);
      case HR_REPORT_TYPE.OFFER_ACCEPTANCE:
        return this.offerAcceptance(companyId, filters);
      case HR_REPORT_TYPE.ATTRITION:
        return this.attrition(companyId, filters);
      case HR_REPORT_TYPE.NOTICE_PERIOD:
        return this.noticePeriodEmployees(companyId, filters);
      case HR_REPORT_TYPE.JOINING_TRENDS:
        return this.joiningTrends(companyId, filters);
      case HR_REPORT_TYPE.LEAVE_ANALYTICS:
        return this.leaveAnalytics(companyId, filters);
      case HR_REPORT_TYPE.TRAINING_COMPLETION:
        return this.trainingCompletionPlaceholder();
      case HR_REPORT_TYPE.DOCUMENT_EXPIRY:
        return this.documentExpiryPlaceholder();
      default:
        return this.employeeGrowth(companyId, filters);
    }
  },

  async employeeGrowth(companyId: string, filters: ReportFilters) {
    const employees = await EmployeeRepository.findMany({}, { companyId });
    const filtered = applyDateFilter(employees, filters);
    const byMonth: Record<string, number> = {};

    for (const emp of filtered) {
      const key = monthKey(emp.createdAt);
      byMonth[key] = (byMonth[key] ?? 0) + 1;
    }

    const trend = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));

    return {
      type: HR_REPORT_TYPE.EMPLOYEE_GROWTH,
      totalEmployees: employees.length,
      newHires: filtered.length,
      byMonth: trend,
    };
  },

  async departmentStrength(companyId: string, filters: ReportFilters) {
    const [employees, departments] = await Promise.all([
      EmployeeRepository.findMany({}, { companyId }),
      DepartmentRepository.findMany({}, { companyId }),
    ]);

    let activeEmployees = employees.filter(
      (e) => e.employmentStatus !== EMPLOYEE_EMPLOYMENT_STATUS.TERMINATED
        && e.employmentStatus !== EMPLOYEE_EMPLOYMENT_STATUS.RESIGNED,
    );

    if (filters.departmentId) {
      activeEmployees = activeEmployees.filter((e) => e.departmentId === filters.departmentId);
    }
    if (filters.branchId) {
      activeEmployees = activeEmployees.filter((e) => e.branchId === filters.branchId);
    }

    const byDepartment: Record<string, { departmentId: string; name: string; count: number }> = {};
    for (const dept of departments) {
      byDepartment[dept.id] = {
        departmentId: dept.id,
        name: dept.name,
        count: activeEmployees.filter((e) => e.departmentId === dept.id).length,
      };
    }

    const unassigned = activeEmployees.filter((e) => !e.departmentId).length;

    return {
      type: HR_REPORT_TYPE.DEPARTMENT_STRENGTH,
      totalDepartments: departments.length,
      totalActive: activeEmployees.length,
      unassigned,
      byDepartment: Object.values(byDepartment),
    };
  },

  async hiringFunnel(companyId: string) {
    const dashboard = await RecruitmentDashboardService.getDashboard(companyId);
    return {
      type: HR_REPORT_TYPE.HIRING_FUNNEL,
      pipelineOverview: dashboard.pipelineOverview,
      conversionRate: dashboard.conversionRate,
    };
  },

  async interviewStats(companyId: string, filters: ReportFilters) {
    const interviews = await InterviewRepository.findMany({}, { companyId });
    let filtered = interviews;

    if (filters.startDate || filters.endDate) {
      filtered = interviews.filter((i) => {
        const t = i.scheduledAt.getTime();
        if (filters.startDate && t < new Date(filters.startDate).getTime()) return false;
        if (filters.endDate) {
          const end = new Date(filters.endDate);
          end.setHours(23, 59, 59, 999);
          if (t > end.getTime()) return false;
        }
        return true;
      });
    }

    const byStatus: Record<string, number> = {};
    for (const interview of filtered) {
      byStatus[interview.status] = (byStatus[interview.status] ?? 0) + 1;
    }

    return {
      type: HR_REPORT_TYPE.INTERVIEW_STATS,
      total: filtered.length,
      scheduled: byStatus[INTERVIEW_STATUS.SCHEDULED] ?? 0,
      completed: byStatus[INTERVIEW_STATUS.COMPLETED] ?? 0,
      cancelled: byStatus[INTERVIEW_STATUS.CANCELLED] ?? 0,
      noShow: byStatus[INTERVIEW_STATUS.NO_SHOW] ?? 0,
      byStatus,
    };
  },

  async offerAcceptance(companyId: string, filters: ReportFilters) {
    const offers = await OfferLetterRepository.findMany({}, { companyId });
    let filtered = offers;

    if (filters.startDate || filters.endDate) {
      filtered = offers.filter((o) => {
        const t = o.createdAt.getTime();
        if (filters.startDate && t < new Date(filters.startDate).getTime()) return false;
        if (filters.endDate) {
          const end = new Date(filters.endDate);
          end.setHours(23, 59, 59, 999);
          if (t > end.getTime()) return false;
        }
        return true;
      });
    }

    const accepted = filtered.filter((o) => o.status === OFFER_STATUS.ACCEPTED).length;
    const declined = filtered.filter((o) => o.status === OFFER_STATUS.DECLINED).length;
    const sent = filtered.filter((o) => o.status === OFFER_STATUS.SENT).length;
    const total = filtered.length || 1;

    return {
      type: HR_REPORT_TYPE.OFFER_ACCEPTANCE,
      total: filtered.length,
      accepted,
      declined,
      pending: sent,
      acceptanceRate: Math.round((accepted / total) * 100),
    };
  },

  async attrition(companyId: string, filters: ReportFilters) {
    const [resignations, employees] = await Promise.all([
      ResignationRepository.findMany({}, { companyId }),
      EmployeeRepository.findMany({}, { companyId }),
    ]);

    const accepted = resignations.filter(
      (r) => r.status === RESIGNATION_STATUS.ACCEPTED || r.status === RESIGNATION_STATUS.SUBMITTED,
    );
    let filtered = applyDateFilter(accepted, filters);

    const byMonth: Record<string, number> = {};
    for (const r of filtered) {
      const key = monthKey(r.createdAt);
      byMonth[key] = (byMonth[key] ?? 0) + 1;
    }

    const activeCount = employees.filter(
      (e) => e.employmentStatus !== EMPLOYEE_EMPLOYMENT_STATUS.TERMINATED
        && e.employmentStatus !== EMPLOYEE_EMPLOYMENT_STATUS.RESIGNED,
    ).length;

    return {
      type: HR_REPORT_TYPE.ATTRITION,
      totalResignations: filtered.length,
      attritionRate: activeCount > 0 ? Math.round((filtered.length / activeCount) * 100) : 0,
      byMonth: Object.entries(byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({ month, count })),
    };
  },

  async noticePeriodEmployees(companyId: string, filters: ReportFilters) {
    const now = new Date();
    const resignations = await ResignationRepository.findMany(
      { status: { $in: [RESIGNATION_STATUS.ACCEPTED, RESIGNATION_STATUS.SUBMITTED, RESIGNATION_STATUS.PENDING] } },
      { companyId },
    );

    let inNotice = resignations.filter((r) => r.expectedLastWorkingDay && r.expectedLastWorkingDay >= now);

    if (filters.departmentId) {
      const employees = await EmployeeRepository.findMany({ departmentId: filters.departmentId }, { companyId });
      const empIds = new Set(employees.map((e) => e.id));
      inNotice = inNotice.filter((r) => empIds.has(r.employeeId));
    }

    return {
      type: HR_REPORT_TYPE.NOTICE_PERIOD,
      count: inNotice.length,
      employees: inNotice.map((r) => ({
        employeeId: r.employeeId,
        expectedLastWorkingDay: r.expectedLastWorkingDay,
        status: r.status,
      })),
    };
  },

  async joiningTrends(companyId: string, filters: ReportFilters) {
    const employees = await EmployeeRepository.findMany({}, { companyId });
    let withJoining = employees.filter((e) => e.joinedAt);

    if (filters.startDate) {
      withJoining = withJoining.filter((e) => e.joinedAt >= new Date(filters.startDate!));
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      withJoining = withJoining.filter((e) => e.joinedAt <= end);
    }

    const byMonth: Record<string, number> = {};
    for (const emp of withJoining) {
      const key = monthKey(emp.joinedAt);
      byMonth[key] = (byMonth[key] ?? 0) + 1;
    }

    return {
      type: HR_REPORT_TYPE.JOINING_TRENDS,
      total: withJoining.length,
      byMonth: Object.entries(byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({ month, count })),
    };
  },

  async leaveAnalytics(companyId: string, filters: ReportFilters) {
    const requests = await LeaveRequestRepository.findMany({}, { companyId });
    let filtered = requests;

    if (filters.startDate || filters.endDate) {
      filtered = requests.filter((r) => {
        const t = r.startDate.getTime();
        if (filters.startDate && t < new Date(filters.startDate).getTime()) return false;
        if (filters.endDate) {
          const end = new Date(filters.endDate);
          end.setHours(23, 59, 59, 999);
          if (t > end.getTime()) return false;
        }
        return true;
      });
    }
    if (filters.departmentId) {
      const employees = await EmployeeRepository.findMany({ departmentId: filters.departmentId }, { companyId });
      const empIds = new Set(employees.map((e) => e.id));
      filtered = filtered.filter((r) => empIds.has(r.employeeId));
    }
    if (filters.employeeId) {
      filtered = filtered.filter((r) => r.employeeId === filters.employeeId);
    }

    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    for (const req of filtered) {
      byStatus[req.status] = (byStatus[req.status] ?? 0) + 1;
      const leaveType = req.leaveTypeId ?? req.leavePolicyId ?? 'unknown';
      byType[leaveType] = (byType[leaveType] ?? 0) + 1;
    }

    return {
      type: HR_REPORT_TYPE.LEAVE_ANALYTICS,
      total: filtered.length,
      pending: byStatus[LEAVE_REQUEST_STATUS.PENDING] ?? 0,
      approved: byStatus[LEAVE_REQUEST_STATUS.APPROVED] ?? 0,
      rejected: byStatus[LEAVE_REQUEST_STATUS.REJECTED] ?? 0,
      byStatus,
      byType,
    };
  },

  trainingCompletionPlaceholder() {
    return {
      type: HR_REPORT_TYPE.TRAINING_COMPLETION,
      status: 'placeholder',
      message: 'Training completion analytics will be available in a future release.',
      completionRate: null,
      byProgram: [],
    };
  },

  documentExpiryPlaceholder() {
    return {
      type: HR_REPORT_TYPE.DOCUMENT_EXPIRY,
      status: 'placeholder',
      message: 'Document expiry tracking will be available in a future release.',
      expiringSoon: [],
      expired: [],
    };
  },
};
