import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import {
  PAYSLIP_STATUS,
  PayslipRepository,
} from '@domain/payroll/payroll.schemas.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { PayrollProcessingService } from '@modules/payroll/services/payroll-processing.service.js';
import { PayrollPolicyService } from '@modules/payroll/services/payroll-policy.service.js';
import { PayrollCalculatorService } from '@modules/payroll/services/payroll-calculator.service.js';
import { EmployeeCompensationService } from '@modules/payroll/services/employee-compensation.service.js';
import { SalaryStructureService } from '@modules/payroll/services/salary-structure.service.js';
import { AttendanceRepository } from '@domain/attendance/attendance.schemas.js';
import { PayrollAuditService } from '@modules/payroll/services/payroll-audit.service.js';
import { PayrollEventService, PAYROLL_NOTIFICATION_JOB } from '@modules/payroll/services/payroll-event.service.js';
import type { PayrollActorContext } from '@modules/approval/types/approval.types.js';

function buildPayslipHtml(input: {
  companyName: string;
  employeeName: string;
  employeeCode?: string;
  periodLabel: string;
  periodStart: Date;
  periodEnd: Date;
  basicSalary: number;
  earnings: Array<{ name: string; amount: number }>;
  deductions: Array<{ name: string; amount: number }>;
  grossSalary: number;
  netSalary: number;
  currency: string;
}): string {
  const earningsRows = input.earnings.map((e) => `<tr><td>${e.name}</td><td style="text-align:right">${input.currency} ${e.amount.toFixed(2)}</td></tr>`).join('');
  const deductionRows = input.deductions.map((d) => `<tr><td>${d.name}</td><td style="text-align:right">${input.currency} ${d.amount.toFixed(2)}</td></tr>`).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Payslip — ${input.periodLabel}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #222; }
    .header { border-bottom: 2px solid #333; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { margin: 0; font-size: 24px; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th, td { border: 1px solid #ddd; padding: 8px; }
    th { background: #f5f5f5; text-align: left; }
    .totals { font-weight: bold; font-size: 16px; }
    .signature { margin-top: 48px; color: #888; font-size: 12px; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>${input.companyName || 'Company'}</h1>
    <p>Payslip for ${input.periodLabel}</p>
  </div>
  <div class="meta">
    <div>
      <strong>Employee:</strong> ${input.employeeName}${input.employeeCode ? ` (${input.employeeCode})` : ''}<br/>
      <strong>Period:</strong> ${input.periodStart.toLocaleDateString()} — ${input.periodEnd.toLocaleDateString()}
    </div>
  </div>
  <h3>Earnings</h3>
  <table><thead><tr><th>Component</th><th>Amount</th></tr></thead><tbody>${earningsRows}</tbody></table>
  <h3>Deductions</h3>
  <table><thead><tr><th>Component</th><th>Amount</th></tr></thead><tbody>${deductionRows}</tbody></table>
  <table>
    <tr class="totals"><td>Gross Salary</td><td style="text-align:right">${input.currency} ${input.grossSalary.toFixed(2)}</td></tr>
    <tr class="totals"><td>Net Salary</td><td style="text-align:right">${input.currency} ${input.netSalary.toFixed(2)}</td></tr>
  </table>
  <div class="signature">Digital signature placeholder — ready for integration</div>
</body>
</html>`;
}

export const PayslipService = {
  async list(companyId: string, query: { payrollId?: string; employeeId?: string; page?: number; pageSize?: number }) {
    const filter: Record<string, unknown> = {};
    if (query.payrollId) filter.payrollId = query.payrollId;
    if (query.employeeId) filter.employeeId = query.employeeId;
    return PayslipRepository.paginate(filter, {
      page: query.page,
      pageSize: query.pageSize,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }, { companyId });
  },

  async getById(companyId: string, id: string) {
    const payslip = await PayslipRepository.findById(id, { companyId });
    if (!payslip) {
      throw new NotFoundError('Payslip not found', ERROR_CODES.NOT_FOUND);
    }
    return payslip;
  },

  async listForPayroll(companyId: string, payrollId: string) {
    const payslips = await PayslipRepository.findMany({ payrollId }, { companyId });
    return payslips.sort((a, b) => a.employeeId.localeCompare(b.employeeId));
  },

  async generateForPayroll(context: PayrollActorContext, payrollId: string) {
    const payroll = await PayrollProcessingService.getById(context.companyId, payrollId);
    const policies = await PayrollPolicyService.getPolicies(context.companyId);

    const employeeFilter: Record<string, unknown> = {};
    if (payroll.departmentId) employeeFilter.departmentId = payroll.departmentId;
    if (payroll.branchId) employeeFilter.branchId = payroll.branchId;

    const employees = await EmployeeRepository.findMany(employeeFilter, { companyId: context.companyId });
    const generated: string[] = [];

    for (const employee of employees) {
      const compensation = await EmployeeCompensationService.getActiveForEmployee(context.companyId, employee.id, payroll.periodEnd);
      if (!compensation) continue;

      const structure = await SalaryStructureService.getById(context.companyId, compensation.salaryStructureId);
      const attendanceRecords = await AttendanceRepository.findMany(
        { employeeId: employee.id, date: { $gte: payroll.periodStart, $lte: payroll.periodEnd } },
        { companyId: context.companyId },
      );
      const attendanceSummary = PayrollCalculatorService.aggregateAttendanceSnapshot(attendanceRecords);

      const calculation = PayrollCalculatorService.calculate({
        baseSalary: compensation.baseSalary,
        structure,
        componentOverrides: compensation.componentOverrides,
        attendanceSummary,
        policies,
      });

      const existingResult = await PayslipRepository.paginate(
        { payrollId, employeeId: employee.id },
        { page: 1, pageSize: 1, sortBy: 'version', sortOrder: 'desc' },
        { companyId: context.companyId },
      );
      const version = (existingResult.items[0]?.version ?? 0) + 1;
      const id = generateUuid();

      const employeeName = [employee.firstName, employee.lastName].filter(Boolean).join(' ');
      const documentHtml = buildPayslipHtml({
        companyName: policies.companyDisplayName,
        employeeName,
        employeeCode: employee.employeeNumber,
        periodLabel: payroll.periodLabel,
        periodStart: payroll.periodStart,
        periodEnd: payroll.periodEnd,
        basicSalary: calculation.basicSalary,
        earnings: calculation.earnings.map((e) => ({ name: e.name, amount: e.amount })),
        deductions: calculation.deductions.map((d) => ({ name: d.name, amount: d.amount })),
        grossSalary: calculation.grossSalary,
        netSalary: calculation.netSalary,
        currency: compensation.currency,
      });

      await PayslipRepository.create(
        {
          id,
          companyId: context.companyId,
          payrollId,
          employeeId: employee.id,
          periodStart: payroll.periodStart,
          periodEnd: payroll.periodEnd,
          basicSalary: calculation.basicSalary,
          grossSalary: calculation.grossSalary,
          netSalary: calculation.netSalary,
          totalDeductions: calculation.totalDeductions,
          totalAllowances: calculation.totalAllowances,
          earnings: calculation.earnings,
          deductions: calculation.deductions,
          employerContributions: calculation.employerContributions,
          employeeContributions: calculation.employeeContributions,
          attendanceSummary: calculation.attendanceSummary,
          variablePay: calculation.variablePay,
          bonus: calculation.bonus,
          reimbursement: calculation.reimbursement,
          version,
          currency: compensation.currency,
          documentHtml,
          pdfMetadata: {
            generatedAt: new Date().toISOString(),
            version,
            digitalSignatureReady: true,
            signaturePlaceholder: true,
          },
          lineItems: calculation.lineItems,
          status: PAYSLIP_STATUS.GENERATED,
          createdBy: context.userId,
          updatedBy: context.userId,
        },
        { companyId: context.companyId },
      );

      generated.push(id);

      if (employee.userId) {
        await PayrollEventService.notify(context, {
          recipientUserId: employee.userId,
          title: 'Payslip generated',
          body: `Your payslip for ${payroll.periodLabel} is ready`,
          entityType: 'payslip',
          entityId: id,
          jobName: PAYROLL_NOTIFICATION_JOB.PAYSLIP_GENERATED,
        });
      }
    }

    await PayrollAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'payroll_run',
      entityId: payrollId,
      action: 'process',
      after: { generatedCount: generated.length },
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return { payrollId, generatedCount: generated.length, payslipIds: generated };
  },

  async getDownloadHtml(companyId: string, id: string): Promise<string> {
    const payslip = await this.getById(companyId, id);
    if (payslip.documentHtml) return payslip.documentHtml;

    const employee = await EmployeeRepository.findById(payslip.employeeId, { companyId });
    const policies = await PayrollPolicyService.getPolicies(companyId);
    const employeeName = employee ? [employee.firstName, employee.lastName].filter(Boolean).join(' ') : 'Employee';

    return buildPayslipHtml({
      companyName: policies.companyDisplayName,
      employeeName,
      employeeCode: employee?.employeeNumber,
      periodLabel: `${payslip.periodStart.toLocaleDateString()} — ${payslip.periodEnd.toLocaleDateString()}`,
      periodStart: payslip.periodStart,
      periodEnd: payslip.periodEnd,
      basicSalary: payslip.basicSalary,
      earnings: payslip.earnings.map((e) => ({ name: e.name, amount: e.amount })),
      deductions: payslip.deductions.map((d) => ({ name: d.name, amount: d.amount })),
      grossSalary: payslip.grossSalary,
      netSalary: payslip.netSalary,
      currency: payslip.currency,
    });
  },
};
