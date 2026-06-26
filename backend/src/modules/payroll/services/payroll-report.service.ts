import { PayrollRepository, PayslipRepository } from '@domain/payroll/payroll.schemas.js';
import { PAYROLL_REPORT_TYPE } from '@modules/payroll/constants/payroll.constants.js';

interface ReportQuery {
  type: string;
  year?: number;
  month?: number;
  departmentId?: string;
  branchId?: string;
  startDate?: string;
  endDate?: string;
}

export const PayrollReportService = {
  async generate(companyId: string, query: ReportQuery) {
    switch (query.type) {
      case PAYROLL_REPORT_TYPE.MONTHLY:
        return this.monthlyReport(companyId, query);
      case PAYROLL_REPORT_TYPE.DEPARTMENT:
        return this.departmentReport(companyId, query);
      case PAYROLL_REPORT_TYPE.BRANCH:
        return this.branchReport(companyId, query);
      case PAYROLL_REPORT_TYPE.SALARY_REGISTER:
        return this.salaryRegister(companyId, query);
      case PAYROLL_REPORT_TYPE.SUMMARY:
        return this.summaryReport(companyId, query);
      case PAYROLL_REPORT_TYPE.ANALYTICS:
        return this.analyticsReport(companyId, query);
      default:
        return this.summaryReport(companyId, query);
    }
  },

  async monthlyReport(companyId: string, query: ReportQuery) {
    const filter: Record<string, unknown> = {};
    if (query.year) filter.year = query.year;
    if (query.month) filter.month = query.month;
    const payrollResult = await PayrollRepository.paginate(filter, {
      page: 1,
      pageSize: 50,
      sortBy: 'periodStart',
      sortOrder: 'desc',
    }, { companyId });
    return { type: PAYROLL_REPORT_TYPE.MONTHLY, payrolls: payrollResult.items };
  },

  async departmentReport(companyId: string, query: ReportQuery) {
    const filter: Record<string, unknown> = {};
    if (query.departmentId) filter.departmentId = query.departmentId;
    if (query.year) filter.year = query.year;
    if (query.month) filter.month = query.month;
    const payrolls = await PayrollRepository.findMany(filter, { companyId });
    return { type: PAYROLL_REPORT_TYPE.DEPARTMENT, departmentId: query.departmentId, payrolls };
  },

  async branchReport(companyId: string, query: ReportQuery) {
    const filter: Record<string, unknown> = {};
    if (query.branchId) filter.branchId = query.branchId;
    if (query.year) filter.year = query.year;
    if (query.month) filter.month = query.month;
    const payrolls = await PayrollRepository.findMany(filter, { companyId });
    return { type: PAYROLL_REPORT_TYPE.BRANCH, branchId: query.branchId, payrolls };
  },

  async salaryRegister(companyId: string, query: ReportQuery) {
    const payrollFilter: Record<string, unknown> = {};
    if (query.year) payrollFilter.year = query.year;
    if (query.month) payrollFilter.month = query.month;

    const payrollResult = await PayrollRepository.paginate(payrollFilter, {
      page: 1,
      pageSize: 1,
      sortBy: 'periodStart',
      sortOrder: 'desc',
    }, { companyId });
    const payroll = payrollResult.items[0];
    if (!payroll) return { type: PAYROLL_REPORT_TYPE.SALARY_REGISTER, rows: [] };

    const payslips = await PayslipRepository.findMany({ payrollId: payroll.id }, { companyId });
    const rows = payslips.map((p) => ({
      employeeId: p.employeeId,
      basicSalary: p.basicSalary,
      grossSalary: p.grossSalary,
      netSalary: p.netSalary,
      totalDeductions: p.totalDeductions,
      currency: p.currency,
    }));

    return { type: PAYROLL_REPORT_TYPE.SALARY_REGISTER, payrollId: payroll.id, periodLabel: payroll.periodLabel, rows };
  },

  async summaryReport(companyId: string, query: ReportQuery) {
    const filter: Record<string, unknown> = {};
    if (query.year) filter.year = query.year;
    const payrolls = await PayrollRepository.findMany(filter, { companyId });

    const totalGross = payrolls.reduce((sum, p) => sum + (p.totalGross ?? 0), 0);
    const totalNet = payrolls.reduce((sum, p) => sum + (p.totalNet ?? 0), 0);
    const totalEmployees = payrolls.reduce((sum, p) => sum + (p.totalEmployees ?? 0), 0);

    return {
      type: PAYROLL_REPORT_TYPE.SUMMARY,
      runCount: payrolls.length,
      totalGross: Math.round(totalGross * 100) / 100,
      totalNet: Math.round(totalNet * 100) / 100,
      totalEmployees,
      payrolls: payrolls.map((p) => ({
        id: p.id,
        periodLabel: p.periodLabel,
        status: p.status,
        totalGross: p.totalGross,
        totalNet: p.totalNet,
        totalEmployees: p.totalEmployees,
      })),
    };
  },

  async analyticsReport(companyId: string, query: ReportQuery) {
    const summary = await this.summaryReport(companyId, query);
    const payslipResult = await PayslipRepository.paginate({}, {
      page: 1,
      pageSize: 500,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }, { companyId });
    const payslips = payslipResult.items;

    const avgNet = payslips.length > 0
      ? payslips.reduce((sum, p) => sum + p.netSalary, 0) / payslips.length
      : 0;

    const byDepartment: Record<string, { count: number; totalNet: number }> = {};
    for (const payslip of payslips) {
      const dept = (payslip.attendanceSummary?.departmentId as string) ?? 'unassigned';
      if (!byDepartment[dept]) byDepartment[dept] = { count: 0, totalNet: 0 };
      byDepartment[dept].count++;
      byDepartment[dept].totalNet += payslip.netSalary;
    }

    return {
      type: PAYROLL_REPORT_TYPE.ANALYTICS,
      summary,
      avgNetSalary: Math.round(avgNet * 100) / 100,
      payslipCount: payslips.length,
      byDepartment,
    };
  },

  async exportCsv(companyId: string, query: ReportQuery): Promise<string> {
    const register = await this.salaryRegister(companyId, query);
    const headers = ['employeeId', 'basicSalary', 'grossSalary', 'netSalary', 'totalDeductions', 'currency'];
    const lines = [headers.join(',')];

    for (const row of register.rows as Array<Record<string, unknown>>) {
      lines.push(headers.map((h) => String(row[h] ?? '')).join(','));
    }

    return lines.join('\n');
  },
};
