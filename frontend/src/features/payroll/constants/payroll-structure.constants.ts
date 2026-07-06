import type { SalaryComponent } from '@/features/payroll/api/payroll.api';

export type PayrollComponentCategory =
  | 'earning'
  | 'allowance'
  | 'incentive'
  | 'variable_pay'
  | 'deduction'
  | 'employee_contribution'
  | 'employer_contribution';

export interface PayrollTemplateComponent extends SalaryComponent {
  category: PayrollComponentCategory;
  description?: string;
  isVariable?: boolean;
  /** When true, HR can skip this component per employee during assignment. */
  isOptional?: boolean;
}

/** Company-standard monthly CTC structure aligned with Indian payroll practice. */
export const INDIA_STANDARD_PAYROLL_TEMPLATE = {
  name: 'India Standard CTC',
  code: 'IN-STD-CTC',
  currency: 'INR',
  description:
    'Standard structure: Basic + HRA + allowances + variable pay, with PF, gratuity, and professional tax.',
  components: [
    {
      name: 'House Rent Allowance (HRA)',
      code: 'HRA',
      type: 'percentage',
      amount: 40,
      isTaxable: true,
      category: 'allowance',
      description: 'Typically 40% of basic for metro cities',
    },
    {
      name: 'Special Allowance',
      code: 'SPECIAL_ALLOW',
      type: 'percentage',
      amount: 30,
      isTaxable: true,
      category: 'allowance',
      description: 'Balancing component for CTC optimization',
    },
    {
      name: 'Conveyance Allowance',
      code: 'CONVEYANCE',
      type: 'fixed',
      amount: 1600,
      isTaxable: false,
      category: 'allowance',
      isOptional: true,
      description: 'Transport reimbursement (tax-exempt up to statutory limit)',
    },
    {
      name: 'Meals Allowance',
      code: 'MEALS',
      type: 'fixed',
      amount: 2200,
      isTaxable: false,
      category: 'allowance',
      isOptional: true,
      description: 'Food / meal coupons or cash allowance',
    },
    {
      name: 'Attendance Allowance',
      code: 'ATTENDANCE',
      type: 'fixed',
      amount: 0,
      isTaxable: true,
      category: 'incentive',
      isVariable: true,
      isOptional: true,
      description: 'Variable — paid based on attendance compliance',
    },
    {
      name: 'Performance Incentive',
      code: 'PERF_INCENTIVE',
      type: 'percentage',
      amount: 0,
      isTaxable: true,
      category: 'incentive',
      isVariable: true,
      isOptional: true,
      description: 'Variable — linked to KPIs / performance review',
    },
    {
      name: 'Provident Fund (Employee)',
      code: 'PF_EE',
      type: 'percentage',
      amount: 12,
      isTaxable: false,
      category: 'employee_contribution',
      description: '12% of basic salary (EPF)',
    },
    {
      name: 'Professional Tax',
      code: 'PROF_TAX',
      type: 'fixed',
      amount: 200,
      isTaxable: false,
      category: 'deduction',
      description: 'State-level professional tax (varies by location)',
    },
  ] satisfies PayrollTemplateComponent[],
} as const;

export const PAYROLL_COMPONENT_CATEGORIES: Array<{
  value: PayrollComponentCategory;
  label: string;
}> = [
  { value: 'earning', label: 'Earning' },
  { value: 'allowance', label: 'Allowance' },
  { value: 'incentive', label: 'Incentive / Bonus' },
  { value: 'variable_pay', label: 'Variable Pay' },
  { value: 'deduction', label: 'Deduction' },
  { value: 'employee_contribution', label: 'Employee Contribution' },
  { value: 'employer_contribution', label: 'Employer Contribution' },
];

export const STATUTORY_EMPLOYER_DEFAULTS = {
  pfEmployerRate: 12,
  gratuityRate: 4.81,
  esiEmployerRate: 3.25,
  esiEmployeeRate: 0.75,
  esiGrossThreshold: 21000,
} as const;

export function buildTemplateComponents(): PayrollTemplateComponent[] {
  return INDIA_STANDARD_PAYROLL_TEMPLATE.components.map((component) => ({ ...component }));
}

/** Suggest monthly basic from annual CTC using ~40% basic share of gross. */
export function suggestBasicFromAnnualCtc(annualCtc: number): number {
  const monthlyCtc = annualCtc / 12;
  return Math.round(monthlyCtc * 0.4);
}

export function isOptionalComponent(component: SalaryComponent): boolean {
  const extended = component as PayrollTemplateComponent;
  return Boolean(extended.isOptional ?? extended.isVariable);
}

export function buildDefaultComponentEnabled(
  components: SalaryComponent[],
): Record<string, boolean> {
  const enabled: Record<string, boolean> = {};
  for (const component of components) {
    if (isOptionalComponent(component)) {
      enabled[component.code] = !component.isVariable && component.amount > 0;
    } else {
      enabled[component.code] = true;
    }
  }
  return enabled;
}
