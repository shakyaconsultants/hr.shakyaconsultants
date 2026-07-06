import type { SalaryComponent } from '@/features/payroll/api/payroll.api';
import {
  STATUTORY_EMPLOYER_DEFAULTS,
  type PayrollComponentCategory,
} from '@/features/payroll/constants/payroll-structure.constants';

export interface ComponentOverrideInput {
  code: string;
  amount: number;
  type?: string;
}

export interface CtcLineItem {
  code: string;
  name: string;
  category: PayrollComponentCategory | 'basic' | 'employer_statutory';
  amount: number;
  isVariable?: boolean;
  note?: string;
}

export interface CtcBreakdown {
  currency: string;
  basicSalary: number;
  fixedEarnings: CtcLineItem[];
  variableEarnings: CtcLineItem[];
  grossSalary: number;
  deductions: CtcLineItem[];
  totalDeductions: number;
  netTakeHome: number;
  employerContributions: CtcLineItem[];
  totalEmployerCost: number;
  monthlyCtc: number;
  annualCtc: number;
}

function resolveCategory(component: SalaryComponent): PayrollComponentCategory | 'deduction' {
  const extended = component as SalaryComponent & { category?: PayrollComponentCategory };
  if (extended.category) return extended.category;
  if (
    component.code.startsWith('DED_') ||
    component.code.includes('PF_EE') ||
    component.code === 'PROF_TAX'
  ) {
    return 'deduction';
  }
  if (component.code === 'PF_EE') return 'employee_contribution';
  return 'allowance';
}

function resolveAmount(component: SalaryComponent, basicSalary: number): number {
  if (component.type === 'percentage') {
    return Math.round((basicSalary * component.amount) / 100);
  }
  return component.amount;
}

function isVariableComponent(component: SalaryComponent): boolean {
  return Boolean((component as SalaryComponent & { isVariable?: boolean }).isVariable);
}

/** Apply employee-level overrides; amount 0 means component is skipped. */
export function resolveEffectiveComponents(
  components: SalaryComponent[],
  componentOverrides?: ComponentOverrideInput[],
): SalaryComponent[] {
  const overrideMap = new Map(componentOverrides?.map((item) => [item.code, item]) ?? []);

  return components
    .map((component) => {
      const override = overrideMap.get(component.code);
      if (override && override.amount === 0) {
        return null;
      }
      if (override) {
        return {
          ...component,
          amount: override.amount,
          type: (override.type as SalaryComponent['type']) ?? component.type,
        };
      }
      return component;
    })
    .filter((component): component is SalaryComponent => component !== null);
}

export function buildComponentOverrides(
  components: SalaryComponent[],
  enabled: Record<string, boolean>,
  customAmounts: Record<string, number>,
): ComponentOverrideInput[] {
  const overrides: ComponentOverrideInput[] = [];

  for (const component of components) {
    if (enabled[component.code] === false) {
      overrides.push({ code: component.code, amount: 0, type: component.type });
      continue;
    }
    const customAmount = customAmounts[component.code];
    if (customAmount !== undefined && customAmount !== component.amount) {
      overrides.push({ code: component.code, amount: customAmount, type: component.type });
    }
  }

  return overrides;
}

export function computeCtcBreakdown(input: {
  baseSalary: number;
  components?: SalaryComponent[];
  componentOverrides?: ComponentOverrideInput[];
  currency?: string;
}): CtcBreakdown {
  const basicSalary = input.baseSalary;
  const currency = input.currency ?? 'INR';
  const components = resolveEffectiveComponents(input.components ?? [], input.componentOverrides);

  const fixedEarnings: CtcLineItem[] = [
    {
      code: 'BASIC',
      name: 'Basic Salary',
      category: 'basic',
      amount: basicSalary,
    },
  ];
  const variableEarnings: CtcLineItem[] = [];
  const deductions: CtcLineItem[] = [];

  let hasPfEmployee = false;
  let hasPfEmployer = false;
  let hasGratuity = false;

  for (const component of components) {
    const category = resolveCategory(component);
    const amount = resolveAmount(component, basicSalary);
    const variable = isVariableComponent(component);

    if (category === 'deduction' || category === 'employee_contribution') {
      if (component.code === 'PF_EE' || component.code === 'PF_EMPLOYEE') hasPfEmployee = true;
      deductions.push({
        code: component.code,
        name: component.name,
        category,
        amount,
        note: component.type === 'percentage' ? `${component.amount}% of basic` : undefined,
      });
      continue;
    }

    if (category === 'employer_contribution') {
      if (component.code.includes('PF')) hasPfEmployer = true;
      if (component.code.includes('GRATUITY')) hasGratuity = true;
      continue;
    }

    const line: CtcLineItem = {
      code: component.code,
      name: component.name,
      category,
      amount,
      isVariable: variable,
      note: component.type === 'percentage' ? `${component.amount}% of basic` : undefined,
    };

    if (variable || category === 'incentive' || category === 'variable_pay') {
      variableEarnings.push(line);
    } else {
      fixedEarnings.push(line);
    }
  }

  if (!hasPfEmployee) {
    const pfAmount = Math.round((basicSalary * STATUTORY_EMPLOYER_DEFAULTS.pfEmployerRate) / 100);
    deductions.push({
      code: 'PF_EE',
      name: 'Provident Fund (Employee)',
      category: 'employee_contribution',
      amount: pfAmount,
      note: `${STATUTORY_EMPLOYER_DEFAULTS.pfEmployerRate}% of basic`,
    });
  }

  const grossSalary =
    fixedEarnings.reduce((sum, item) => sum + item.amount, 0) +
    variableEarnings.reduce((sum, item) => sum + item.amount, 0);

  const employerContributions: CtcLineItem[] = [];

  if (!hasPfEmployer) {
    employerContributions.push({
      code: 'PF_ER',
      name: 'Provident Fund (Employer)',
      category: 'employer_statutory',
      amount: Math.round((basicSalary * STATUTORY_EMPLOYER_DEFAULTS.pfEmployerRate) / 100),
      note: `${STATUTORY_EMPLOYER_DEFAULTS.pfEmployerRate}% of basic`,
    });
  }

  if (!hasGratuity) {
    employerContributions.push({
      code: 'GRATUITY',
      name: 'Gratuity Provision',
      category: 'employer_statutory',
      amount: Math.round((basicSalary * STATUTORY_EMPLOYER_DEFAULTS.gratuityRate) / 100),
      note: `~${STATUTORY_EMPLOYER_DEFAULTS.gratuityRate}% of basic (accrual)`,
    });
  }

  if (grossSalary <= STATUTORY_EMPLOYER_DEFAULTS.esiGrossThreshold) {
    employerContributions.push({
      code: 'ESI_ER',
      name: 'ESI (Employer)',
      category: 'employer_statutory',
      amount: Math.round((grossSalary * STATUTORY_EMPLOYER_DEFAULTS.esiEmployerRate) / 100),
      note: `${STATUTORY_EMPLOYER_DEFAULTS.esiEmployerRate}% of gross (if eligible)`,
    });
    if (!deductions.some((item) => item.code === 'ESI_EE')) {
      deductions.push({
        code: 'ESI_EE',
        name: 'ESI (Employee)',
        category: 'employee_contribution',
        amount: Math.round((grossSalary * STATUTORY_EMPLOYER_DEFAULTS.esiEmployeeRate) / 100),
        note: `${STATUTORY_EMPLOYER_DEFAULTS.esiEmployeeRate}% of gross (if eligible)`,
      });
    }
  }

  const totalDeductions = deductions.reduce((sum, item) => sum + item.amount, 0);
  const netTakeHome = grossSalary - totalDeductions;
  const totalEmployerCost = employerContributions.reduce((sum, item) => sum + item.amount, 0);
  const monthlyCtc = grossSalary + totalEmployerCost;
  const annualCtc = monthlyCtc * 12;

  return {
    currency,
    basicSalary,
    fixedEarnings,
    variableEarnings,
    grossSalary,
    deductions,
    totalDeductions,
    netTakeHome,
    employerContributions,
    totalEmployerCost,
    monthlyCtc,
    annualCtc,
  };
}

export function formatInr(amount: number, currency = 'INR'): string {
  if (currency === 'INR') {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
  return `${currency} ${amount.toLocaleString()}`;
}
