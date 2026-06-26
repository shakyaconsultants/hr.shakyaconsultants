import type { AttendancePayrollSnapshot } from '@domain/attendance/attendance.schemas.js';
import {
  PAYROLL_COMPONENT_CATEGORY,
  SALARY_COMPONENT_TYPE,
  type PayrollLineItem,
  type SalaryStructureDocument,
} from '@domain/payroll/payroll.schemas.js';
import type { PayrollPolicySettings, StatutoryPluginConfig } from '@modules/payroll/services/payroll-policy.service.js';

export interface PayrollCalculationInput {
  baseSalary: number;
  structure?: SalaryStructureDocument | null;
  componentOverrides?: Array<{ code: string; amount: number; type?: string }>;
  attendanceSummary: AttendancePayrollSnapshot & Record<string, unknown>;
  variablePay?: number;
  bonus?: number;
  reimbursement?: number;
  policies: PayrollPolicySettings;
}

export interface PayrollCalculationResult {
  basicSalary: number;
  earnings: PayrollLineItem[];
  deductions: PayrollLineItem[];
  employerContributions: PayrollLineItem[];
  employeeContributions: PayrollLineItem[];
  lineItems: PayrollLineItem[];
  totalAllowances: number;
  totalDeductions: number;
  grossSalary: number;
  netSalary: number;
  variablePay: number;
  bonus: number;
  reimbursement: number;
  attendanceSummary: Record<string, unknown>;
}

function computeComponentAmount(
  baseSalary: number,
  type: string,
  amount: number,
): number {
  if (type === SALARY_COMPONENT_TYPE.PERCENTAGE) {
    return Math.round((baseSalary * amount) / 100 * 100) / 100;
  }
  return amount;
}

function applyLwpDeduction(
  baseSalary: number,
  attendanceSummary: AttendancePayrollSnapshot,
  lwpBasis: string,
): number {
  const lopDays = typeof attendanceSummary.lopDays === 'number' ? attendanceSummary.lopDays : 0;
  if (lopDays <= 0) return 0;

  const workingDays = typeof attendanceSummary.payableDays === 'number'
    ? (attendanceSummary.payableDays as number) + lopDays
    : 30;

  if (lwpBasis === 'daily' && workingDays > 0) {
    const dailyRate = baseSalary / workingDays;
    return Math.round(dailyRate * lopDays * 100) / 100;
  }
  return 0;
}

function applyOvertime(
  baseSalary: number,
  attendanceSummary: AttendancePayrollSnapshot,
  multiplier: number,
): number {
  const overtimeMinutes = typeof attendanceSummary.overtimeMinutes === 'number' ? attendanceSummary.overtimeMinutes : 0;
  if (overtimeMinutes <= 0) return 0;

  const hourlyRate = baseSalary / (30 * 8);
  const overtimeHours = overtimeMinutes / 60;
  return Math.round(hourlyRate * overtimeHours * multiplier * 100) / 100;
}

function applyStatutoryPlugins(
  grossSalary: number,
  basicSalary: number,
  plugins: StatutoryPluginConfig[],
): { employer: PayrollLineItem[]; employee: PayrollLineItem[]; deductions: PayrollLineItem[] } {
  const employer: PayrollLineItem[] = [];
  const employee: PayrollLineItem[] = [];
  const deductions: PayrollLineItem[] = [];

  for (const plugin of plugins) {
    if (!plugin.enabled) continue;

    const config = plugin.config ?? {};
    const basis = typeof config.basis === 'string' ? config.basis : 'gross';
    const rate = typeof config.rate === 'number' ? config.rate : 0;
    const basisAmount = basis === 'basic' ? basicSalary : grossSalary;
    const amount = Math.round((basisAmount * rate) / 100 * 100) / 100;
    if (amount <= 0) continue;

    const code = typeof config.code === 'string' ? config.code : plugin.pluginId.toUpperCase();
    const name = typeof config.name === 'string' ? config.name : plugin.pluginId;
    const employerRate = typeof config.employerRate === 'number' ? config.employerRate : 0;
    const employeeRate = typeof config.employeeRate === 'number' ? config.employeeRate : rate;

    const employeeAmount = Math.round((basisAmount * employeeRate) / 100 * 100) / 100;
    const employerAmount = Math.round((basisAmount * employerRate) / 100 * 100) / 100;

    if (employeeAmount > 0) {
      const item: PayrollLineItem = {
        code,
        name,
        category: PAYROLL_COMPONENT_CATEGORY.EMPLOYEE_CONTRIBUTION,
        amount: employeeAmount,
        metadata: { pluginId: plugin.pluginId },
      };
      employee.push(item);
      deductions.push({ ...item, category: PAYROLL_COMPONENT_CATEGORY.DEDUCTION });
    }

    if (employerAmount > 0) {
      employer.push({
        code: `${code}_ER`,
        name: `${name} (Employer)`,
        category: PAYROLL_COMPONENT_CATEGORY.EMPLOYER_CONTRIBUTION,
        amount: employerAmount,
        metadata: { pluginId: plugin.pluginId },
      });
    }
  }

  return { employer, employee, deductions };
}

export const PayrollCalculatorService = {
  calculate(input: PayrollCalculationInput): PayrollCalculationResult {
    const basicSalary = input.baseSalary;
    const earnings: PayrollLineItem[] = [];
    const deductions: PayrollLineItem[] = [];

    earnings.push({
      code: 'BASIC',
      name: 'Basic Salary',
      category: PAYROLL_COMPONENT_CATEGORY.EARNING,
      amount: basicSalary,
      isTaxable: true,
    });

    const overrideMap = new Map((input.componentOverrides ?? []).map((o) => [o.code, o]));

    if (input.structure?.components) {
      for (const comp of input.structure.components) {
        const override = overrideMap.get(comp.code);
        const type = override?.type ?? comp.type;
        const rawAmount = override?.amount ?? comp.amount;
        const amount = computeComponentAmount(basicSalary, type, rawAmount);

        const item: PayrollLineItem = {
          code: comp.code,
          name: comp.name,
          category: comp.category ?? PAYROLL_COMPONENT_CATEGORY.ALLOWANCE,
          amount,
          isTaxable: comp.isTaxable,
        };

        if (comp.category === PAYROLL_COMPONENT_CATEGORY.DEDUCTION || comp.code.startsWith('DED_')) {
          deductions.push(item);
        } else {
          earnings.push(item);
        }
      }
    }

    const lwpAmount = applyLwpDeduction(basicSalary, input.attendanceSummary, input.policies.lwpDeductionBasis);
    if (lwpAmount > 0) {
      deductions.push({
        code: 'LWP',
        name: 'Loss of Pay',
        category: PAYROLL_COMPONENT_CATEGORY.DEDUCTION,
        amount: lwpAmount,
      });
    }

    const overtimeAmount = applyOvertime(basicSalary, input.attendanceSummary, input.policies.overtimeRateMultiplier);
    if (overtimeAmount > 0) {
      earnings.push({
        code: 'OT',
        name: 'Overtime',
        category: PAYROLL_COMPONENT_CATEGORY.EARNING,
        amount: overtimeAmount,
      });
    }

    const variablePay = input.variablePay ?? 0;
    if (variablePay > 0) {
      earnings.push({
        code: 'VAR',
        name: 'Variable Pay',
        category: PAYROLL_COMPONENT_CATEGORY.VARIABLE_PAY,
        amount: variablePay,
      });
    }

    const bonus = input.bonus ?? 0;
    if (bonus > 0) {
      earnings.push({
        code: 'BONUS',
        name: 'Bonus',
        category: PAYROLL_COMPONENT_CATEGORY.BONUS,
        amount: bonus,
      });
    }

    const reimbursement = input.reimbursement ?? 0;
    if (reimbursement > 0) {
      earnings.push({
        code: 'REIMB',
        name: 'Reimbursement',
        category: PAYROLL_COMPONENT_CATEGORY.REIMBURSEMENT,
        amount: reimbursement,
        isTaxable: false,
      });
    }

    const totalAllowances = earnings
      .filter((e) => e.code !== 'BASIC')
      .reduce((sum, e) => sum + e.amount, 0);

    const grossSalary = earnings.reduce((sum, e) => sum + e.amount, 0);

    const statutory = applyStatutoryPlugins(grossSalary, basicSalary, input.policies.statutoryPlugins);
    deductions.push(...statutory.deductions);

    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
    const netSalary = Math.max(0, Math.round((grossSalary - totalDeductions) * 100) / 100);

    const lineItems = [...earnings, ...deductions, ...statutory.employer, ...statutory.employee];

    return {
      basicSalary,
      earnings,
      deductions,
      employerContributions: statutory.employer,
      employeeContributions: statutory.employee,
      lineItems,
      totalAllowances,
      totalDeductions,
      grossSalary,
      netSalary,
      variablePay,
      bonus,
      reimbursement,
      attendanceSummary: input.attendanceSummary,
    };
  },

  aggregateAttendanceSnapshot(records: Array<{ payrollSnapshot?: AttendancePayrollSnapshot; status?: string }>): AttendancePayrollSnapshot {
    const summary: AttendancePayrollSnapshot = {
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      halfDays: 0,
      overtimeMinutes: 0,
      payableDays: 0,
      lopDays: 0,
    };

    for (const record of records) {
      const snap = record.payrollSnapshot ?? {};
      summary.presentDays = (summary.presentDays ?? 0) + (typeof snap.presentDays === 'number' ? snap.presentDays : 0);
      summary.absentDays = (summary.absentDays ?? 0) + (typeof snap.absentDays === 'number' ? snap.absentDays : 0);
      summary.lateDays = (summary.lateDays ?? 0) + (typeof snap.lateDays === 'number' ? snap.lateDays : 0);
      summary.halfDays = (summary.halfDays ?? 0) + (typeof snap.halfDays === 'number' ? snap.halfDays : 0);
      summary.overtimeMinutes = (summary.overtimeMinutes ?? 0) + (typeof snap.overtimeMinutes === 'number' ? snap.overtimeMinutes : (record as { overtimeMinutes?: number }).overtimeMinutes ?? 0);
      summary.payableDays = (summary.payableDays ?? 0) + (typeof snap.payableDays === 'number' ? snap.payableDays : 0);
      summary.lopDays = (summary.lopDays ?? 0) + (typeof snap.lopDays === 'number' ? snap.lopDays : 0);
    }

    return summary;
  },
};
