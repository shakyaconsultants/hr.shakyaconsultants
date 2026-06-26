import { PayrollRepository, PayslipRepository } from '@domain/payroll/payroll.schemas.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import { PAYROLL_STATUS } from '@shared/constants/status.constants.js';

export const PayrollDashboardService = {
  async getEnterpriseDashboard(companyId: string, query?: { year?: number; month?: number }) {
    const filter: Record<string, unknown> = {};
    if (query?.year) filter.year = query.year;
    if (query?.month) filter.month = query.month;

    const payrollResult = await PayrollRepository.paginate(filter, {
      page: 1,
      pageSize: 12,
      sortBy: 'periodStart',
      sortOrder: 'desc',
    }, { companyId });
    const payrolls = payrollResult.items;
    const employees = await EmployeeRepository.findMany({}, { companyId });

    const totalGross = payrolls.reduce((sum, p) => sum + (p.totalGross ?? 0), 0);
    const totalNet = payrolls.reduce((sum, p) => sum + (p.totalNet ?? 0), 0);
    const pendingApproval = payrolls.filter((p) => p.status === PAYROLL_STATUS.PENDING_APPROVAL).length;
    const locked = payrolls.filter((p) => p.isLocked).length;

    return {
      totalEmployees: employees.length,
      payrollRuns: payrolls.length,
      totalGross: Math.round(totalGross * 100) / 100,
      totalNet: Math.round(totalNet * 100) / 100,
      pendingApproval,
      lockedRuns: locked,
      recentRuns: payrolls.slice(0, 5).map((p) => ({
        id: p.id,
        periodLabel: p.periodLabel,
        status: p.status,
        totalNet: p.totalNet,
        isLocked: p.isLocked,
      })),
    };
  },

  async getFinanceDashboard(companyId: string, query?: { year?: number; month?: number }) {
    const filter: Record<string, unknown> = {};
    if (query?.year) filter.year = query.year;
    if (query?.month) filter.month = query.month;

    const payrollResult = await PayrollRepository.paginate(filter, {
      page: 1,
      pageSize: 50,
      sortBy: 'periodStart',
      sortOrder: 'desc',
    }, { companyId });
    const payrolls = payrollResult.items;
    const payslipResult = await PayslipRepository.paginate({}, {
      page: 1,
      pageSize: 200,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }, { companyId });
    const payslips = payslipResult.items;

    const totalDeductions = payslips.reduce((sum, p) => sum + p.totalDeductions, 0);
    const totalEmployerContributions = payslips.reduce(
      (sum, p) => sum + p.employerContributions.reduce((s, c) => s + c.amount, 0),
      0,
    );

    const monthlyTrend = payrolls.map((p) => ({
      periodLabel: p.periodLabel,
      totalGross: p.totalGross ?? 0,
      totalNet: p.totalNet ?? 0,
      status: p.status,
    }));

    return {
      totalPayrollCost: payrolls.reduce((sum, p) => sum + (p.totalGross ?? 0) + totalEmployerContributions / Math.max(payslips.length, 1), 0),
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      totalEmployerContributions: Math.round(totalEmployerContributions * 100) / 100,
      approvedRuns: payrolls.filter((p) => p.status === PAYROLL_STATUS.APPROVED || p.status === PAYROLL_STATUS.FINALIZED).length,
      monthlyTrend,
    };
  },

  async getHrDashboard(companyId: string, query?: { year?: number; month?: number }) {
    const filter: Record<string, unknown> = {};
    if (query?.year) filter.year = query.year;
    if (query?.month) filter.month = query.month;

    const payrollResult = await PayrollRepository.paginate(filter, {
      page: 1,
      pageSize: 6,
      sortBy: 'periodStart',
      sortOrder: 'desc',
    }, { companyId });
    const payrolls = payrollResult.items;
    const exceptionsTotal = payrolls.reduce((sum, p) => sum + (p.exceptionsCount ?? 0), 0);
    const draftRuns = payrolls.filter((p) => p.status === PAYROLL_STATUS.DRAFT).length;
    const processingRuns = payrolls.filter((p) => p.status === PAYROLL_STATUS.PROCESSING).length;

    const employeesWithoutCompensation = await EmployeeRepository.count({}, { companyId });

    return {
      draftRuns,
      processingRuns,
      pendingApproval: payrolls.filter((p) => p.status === PAYROLL_STATUS.PENDING_APPROVAL).length,
      exceptionsTotal,
      employeesTracked: employeesWithoutCompensation,
      recentRuns: payrolls.map((p) => ({
        id: p.id,
        periodLabel: p.periodLabel,
        status: p.status,
        exceptionsCount: p.exceptionsCount ?? 0,
        totalEmployees: p.totalEmployees ?? 0,
      })),
    };
  },

  async getExceptions(companyId: string, query?: { payrollId?: string }) {
    if (query?.payrollId) {
      const payroll = await PayrollRepository.findById(query.payrollId, { companyId });
      if (!payroll) return { exceptions: [], count: 0 };
      return {
        payrollId: query.payrollId,
        count: payroll.exceptionsCount ?? 0,
        exceptions: [],
        note: 'Employees without compensation or attendance gaps during processing',
      };
    }

    const payrollResult = await PayrollRepository.paginate(
      { exceptionsCount: { $gt: 0 } },
      { page: 1, pageSize: 20, sortBy: 'periodStart', sortOrder: 'desc' },
      { companyId },
    );
    const payrolls = payrollResult.items;

    return {
      count: payrolls.reduce((sum, p) => sum + (p.exceptionsCount ?? 0), 0),
      runs: payrolls.map((p) => ({
        id: p.id,
        periodLabel: p.periodLabel,
        exceptionsCount: p.exceptionsCount ?? 0,
      })),
    };
  },
};
