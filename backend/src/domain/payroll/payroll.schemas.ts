import { Schema, type SchemaDefinition } from 'mongoose';
import { defineDomainModel } from '@infrastructure/database/model.factory.js';
import { COLLECTIONS } from '@infrastructure/database/constants/collections.js';
import type { BaseDocument } from '@infrastructure/database/types/base-document.types.js';
import { ENTITY_STATUS, PAYROLL_STATUS } from '@shared/constants/status.constants.js';

export const SALARY_COMPONENT_TYPE = {
  FIXED: 'fixed',
  PERCENTAGE: 'percentage',
} as const;

export const SALARY_REVISION_TYPE = {
  PROMOTION: 'promotion',
  ANNUAL_INCREMENT: 'annual_increment',
  CORRECTION: 'correction',
} as const;

export const SALARY_REVISION_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ACTIVE: 'active',
  SUPERSEDED: 'superseded',
} as const;

export const PAYROLL_COMPONENT_CATEGORY = {
  EARNING: 'earning',
  DEDUCTION: 'deduction',
  ALLOWANCE: 'allowance',
  REIMBURSEMENT: 'reimbursement',
  BONUS: 'bonus',
  INCENTIVE: 'incentive',
  VARIABLE_PAY: 'variable_pay',
  EMPLOYER_CONTRIBUTION: 'employer_contribution',
  EMPLOYEE_CONTRIBUTION: 'employee_contribution',
} as const;

export const PAYSLIP_STATUS = {
  GENERATED: 'generated',
  UPLOADED: 'uploaded',
  SENT: 'sent',
  ACKNOWLEDGED: 'acknowledged',
} as const;

export const EMPLOYEE_COMPENSATION_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUPERSEDED: 'superseded',
} as const;

export interface PayrollLineItem {
  code: string;
  name: string;
  category: string;
  amount: number;
  isTaxable?: boolean;
  metadata?: Record<string, unknown>;
}

export interface SalaryStructureDocument extends BaseDocument {
  name: string;
  code: string;
  baseSalary: number;
  currency: string;
  components: Array<{
    name: string;
    code: string;
    type: string;
    category?: string;
    amount: number;
    isTaxable: boolean;
  }>;
  status: string;
}

export interface PayrollDocument extends BaseDocument {
  periodStart: Date;
  periodEnd: Date;
  year: number;
  month: number;
  periodLabel: string;
  status: string;
  processedAt?: Date;
  finalizedAt?: Date;
  processedBy?: string;
  totalEmployees?: number;
  totalGross?: number;
  totalNet?: number;
  isLocked: boolean;
  lockedAt?: Date;
  lockedBy?: string;
  approvalRequestId?: string;
  departmentId?: string;
  branchId?: string;
  exceptionsCount?: number;
}

export interface PayslipDocument extends BaseDocument {
  payrollId: string;
  employeeId: string;
  periodStart: Date;
  periodEnd: Date;
  basicSalary: number;
  grossSalary: number;
  netSalary: number;
  totalDeductions: number;
  totalAllowances: number;
  earnings: PayrollLineItem[];
  deductions: PayrollLineItem[];
  employerContributions: PayrollLineItem[];
  employeeContributions: PayrollLineItem[];
  attendanceSummary: Record<string, unknown>;
  variablePay: number;
  bonus: number;
  reimbursement: number;
  version: number;
  currency: string;
  pdfUrl?: string;
  documentHtml?: string;
  pdfMetadata?: Record<string, unknown>;
  lineItems: PayrollLineItem[];
  status: string;
}

export interface AllowanceDocument extends BaseDocument {
  name: string;
  code: string;
  amount: number;
  type: string;
  category?: string;
  isTaxable: boolean;
  status: string;
}

export interface DeductionDocument extends BaseDocument {
  name: string;
  code: string;
  amount: number;
  type: string;
  category?: string;
  isStatutory: boolean;
  status: string;
}

export interface SalaryRevisionTimelineEntry {
  status: string;
  changedAt: Date;
  changedBy?: string;
  note?: string;
}

export interface SalaryRevisionDocument extends BaseDocument {
  employeeId: string;
  revisionType: string;
  status: string;
  salaryStructureId?: string;
  previousStructureId?: string;
  previousSalary: number;
  newSalary: number;
  newBaseSalary: number;
  effectiveFrom: Date;
  reason: string;
  approvalRequestId?: string;
  version: number;
  timeline: SalaryRevisionTimelineEntry[];
  approvedBy?: string;
  approvedAt?: Date;
}

export interface ComponentOverride {
  code: string;
  amount: number;
  type?: string;
}

export interface EmployeeCompensationDocument extends BaseDocument {
  employeeId: string;
  salaryStructureId: string;
  baseSalary: number;
  currency: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  componentOverrides: ComponentOverride[];
  status: string;
}

const salaryStructureFields: SchemaDefinition = {
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  baseSalary: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR' },
  components: {
    type: [
      {
        name: { type: String, required: true },
        code: { type: String, required: true },
        type: { type: String, enum: Object.values(SALARY_COMPONENT_TYPE), required: true },
        category: { type: String, enum: Object.values(PAYROLL_COMPONENT_CATEGORY) },
        amount: { type: Number, required: true, min: 0 },
        isTaxable: { type: Boolean, default: true },
      },
    ],
    default: [],
  },
  status: { type: String, enum: Object.values(ENTITY_STATUS), default: ENTITY_STATUS.ACTIVE },
};

const payrollFields: SchemaDefinition = {
  periodStart: { type: Date, required: true, index: true },
  periodEnd: { type: Date, required: true, index: true },
  year: { type: Number, required: true, index: true },
  month: { type: Number, required: true, min: 1, max: 12, index: true },
  periodLabel: { type: String, required: true, trim: true },
  status: { type: String, enum: Object.values(PAYROLL_STATUS), default: PAYROLL_STATUS.DRAFT },
  processedAt: { type: Date },
  finalizedAt: { type: Date },
  processedBy: { type: String, index: true },
  totalEmployees: { type: Number, min: 0 },
  totalGross: { type: Number, min: 0 },
  totalNet: { type: Number, min: 0 },
  isLocked: { type: Boolean, default: false, index: true },
  lockedAt: { type: Date },
  lockedBy: { type: String, index: true },
  approvalRequestId: { type: String, index: true },
  departmentId: { type: String, index: true },
  branchId: { type: String, index: true },
  exceptionsCount: { type: Number, min: 0, default: 0 },
};

const lineItemSchema = {
  code: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  isTaxable: { type: Boolean },
  metadata: { type: Schema.Types.Mixed },
};

const payslipFields: SchemaDefinition = {
  payrollId: { type: String, required: true, index: true },
  employeeId: { type: String, required: true, index: true },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  basicSalary: { type: Number, required: true, min: 0 },
  grossSalary: { type: Number, required: true, min: 0 },
  netSalary: { type: Number, required: true, min: 0 },
  totalDeductions: { type: Number, required: true, min: 0 },
  totalAllowances: { type: Number, required: true, min: 0 },
  earnings: { type: [lineItemSchema], default: [] },
  deductions: { type: [lineItemSchema], default: [] },
  employerContributions: { type: [lineItemSchema], default: [] },
  employeeContributions: { type: [lineItemSchema], default: [] },
  attendanceSummary: { type: Schema.Types.Mixed, default: {} },
  variablePay: { type: Number, default: 0, min: 0 },
  bonus: { type: Number, default: 0, min: 0 },
  reimbursement: { type: Number, default: 0, min: 0 },
  version: { type: Number, default: 1, min: 1 },
  currency: { type: String, default: 'INR' },
  pdfUrl: { type: String },
  documentHtml: { type: String },
  pdfMetadata: { type: Schema.Types.Mixed },
  lineItems: { type: [lineItemSchema], default: [] },
  status: { type: String, enum: Object.values(PAYSLIP_STATUS), default: PAYSLIP_STATUS.GENERATED },
};

const allowanceFields: SchemaDefinition = {
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  amount: { type: Number, required: true, min: 0 },
  type: { type: String, enum: Object.values(SALARY_COMPONENT_TYPE), default: SALARY_COMPONENT_TYPE.FIXED },
  category: { type: String, enum: Object.values(PAYROLL_COMPONENT_CATEGORY), default: PAYROLL_COMPONENT_CATEGORY.ALLOWANCE },
  isTaxable: { type: Boolean, default: true },
  status: { type: String, enum: Object.values(ENTITY_STATUS), default: ENTITY_STATUS.ACTIVE },
};

const deductionFields: SchemaDefinition = {
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  amount: { type: Number, required: true, min: 0 },
  type: { type: String, enum: Object.values(SALARY_COMPONENT_TYPE), default: SALARY_COMPONENT_TYPE.FIXED },
  category: { type: String, enum: Object.values(PAYROLL_COMPONENT_CATEGORY), default: PAYROLL_COMPONENT_CATEGORY.DEDUCTION },
  isStatutory: { type: Boolean, default: false },
  status: { type: String, enum: Object.values(ENTITY_STATUS), default: ENTITY_STATUS.ACTIVE },
};

const salaryRevisionFields: SchemaDefinition = {
  employeeId: { type: String, required: true, index: true },
  revisionType: { type: String, enum: Object.values(SALARY_REVISION_TYPE), required: true },
  status: { type: String, enum: Object.values(SALARY_REVISION_STATUS), default: SALARY_REVISION_STATUS.DRAFT },
  salaryStructureId: { type: String, index: true },
  previousStructureId: { type: String },
  previousSalary: { type: Number, required: true, min: 0 },
  newSalary: { type: Number, required: true, min: 0 },
  newBaseSalary: { type: Number, required: true, min: 0 },
  effectiveFrom: { type: Date, required: true, index: true },
  reason: { type: String, required: true, trim: true },
  approvalRequestId: { type: String, index: true },
  version: { type: Number, default: 1, min: 1 },
  timeline: {
    type: [
      {
        status: { type: String, required: true },
        changedAt: { type: Date, required: true },
        changedBy: { type: String },
        note: { type: String },
      },
    ],
    default: [],
  },
  approvedBy: { type: String, index: true },
  approvedAt: { type: Date },
};

const employeeCompensationFields: SchemaDefinition = {
  employeeId: { type: String, required: true, index: true },
  salaryStructureId: { type: String, required: true, index: true },
  baseSalary: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR' },
  effectiveFrom: { type: Date, required: true, index: true },
  effectiveTo: { type: Date },
  componentOverrides: {
    type: [
      {
        code: { type: String, required: true },
        amount: { type: Number, required: true, min: 0 },
        type: { type: String },
      },
    ],
    default: [],
  },
  status: { type: String, enum: Object.values(EMPLOYEE_COMPENSATION_STATUS), default: EMPLOYEE_COMPENSATION_STATUS.ACTIVE },
};

export const salaryStructureModel = defineDomainModel<SalaryStructureDocument>(
  'SalaryStructure',
  COLLECTIONS.SALARY_STRUCTURES,
  salaryStructureFields,
  {
    indexes: [
      { fields: { companyId: 1, code: 1 }, options: { unique: true, name: 'uq_salary_structures_company_code' } },
      { fields: { companyId: 1, status: 1 }, options: { name: 'idx_salary_structures_company_status' } },
    ],
  },
);

export const payrollModel = defineDomainModel<PayrollDocument>(
  'Payroll',
  COLLECTIONS.PAYROLLS,
  payrollFields,
  {
    indexes: [
      { fields: { companyId: 1, year: 1, month: 1, departmentId: 1, branchId: 1 }, options: { unique: true, name: 'uq_payrolls_company_period_scope' } },
      { fields: { companyId: 1, status: 1 }, options: { name: 'idx_payrolls_company_status' } },
      { fields: { companyId: 1, isLocked: 1 }, options: { name: 'idx_payrolls_company_locked' } },
    ],
  },
);

export const payslipModel = defineDomainModel<PayslipDocument>(
  'Payslip',
  COLLECTIONS.PAYSLIPS,
  payslipFields,
  {
    indexes: [
      { fields: { companyId: 1, payrollId: 1, employeeId: 1, version: 1 }, options: { unique: true, name: 'uq_payslips_company_payroll_employee_version' } },
      { fields: { companyId: 1, employeeId: 1, createdAt: -1 }, options: { name: 'idx_payslips_company_employee_date' } },
    ],
  },
);

export const allowanceModel = defineDomainModel<AllowanceDocument>(
  'Allowance',
  COLLECTIONS.ALLOWANCES,
  allowanceFields,
  {
    indexes: [
      { fields: { companyId: 1, code: 1 }, options: { unique: true, name: 'uq_allowances_company_code' } },
    ],
  },
);

export const deductionModel = defineDomainModel<DeductionDocument>(
  'Deduction',
  COLLECTIONS.DEDUCTIONS,
  deductionFields,
  {
    indexes: [
      { fields: { companyId: 1, code: 1 }, options: { unique: true, name: 'uq_deductions_company_code' } },
    ],
  },
);

export const salaryRevisionModel = defineDomainModel<SalaryRevisionDocument>(
  'SalaryRevision',
  COLLECTIONS.SALARY_REVISIONS,
  salaryRevisionFields,
  {
    indexes: [
      { fields: { companyId: 1, employeeId: 1, version: 1 }, options: { unique: true, name: 'uq_salary_revisions_company_employee_version' } },
      { fields: { companyId: 1, employeeId: 1, effectiveFrom: -1 }, options: { name: 'idx_salary_revisions_company_employee_date' } },
      { fields: { companyId: 1, status: 1 }, options: { name: 'idx_salary_revisions_company_status' } },
    ],
  },
);

export const employeeCompensationModel = defineDomainModel<EmployeeCompensationDocument>(
  'EmployeeCompensation',
  COLLECTIONS.EMPLOYEE_COMPENSATIONS,
  employeeCompensationFields,
  {
    indexes: [
      { fields: { companyId: 1, employeeId: 1, effectiveFrom: -1 }, options: { name: 'idx_employee_compensations_company_employee_date' } },
      { fields: { companyId: 1, employeeId: 1, status: 1 }, options: { name: 'idx_employee_compensations_company_employee_status' } },
    ],
  },
);

export const SalaryStructureModel = salaryStructureModel.model;
export const PayrollModel = payrollModel.model;
export const PayslipModel = payslipModel.model;
export const AllowanceModel = allowanceModel.model;
export const DeductionModel = deductionModel.model;
export const SalaryRevisionModel = salaryRevisionModel.model;
export const EmployeeCompensationModel = employeeCompensationModel.model;

export const SalaryStructureRepository = salaryStructureModel.repository;
export const PayrollRepository = payrollModel.repository;
export const PayslipRepository = payslipModel.repository;
export const AllowanceRepository = allowanceModel.repository;
export const DeductionRepository = deductionModel.repository;
export const SalaryRevisionRepository = salaryRevisionModel.repository;
export const EmployeeCompensationRepository = employeeCompensationModel.repository;
