import { z } from 'zod';
import {
  PAYROLL_COMPONENT_CATEGORY,
  SALARY_COMPONENT_TYPE,
  SALARY_REVISION_TYPE,
} from '@domain/payroll/payroll.schemas.js';
import { PAYROLL_STATUS } from '@shared/constants/status.constants.js';
import { PAYROLL_COMPONENT_KIND, PAYROLL_REPORT_TYPE } from '@modules/payroll/constants/payroll.constants.js';

export const idParamSchema = z.object({ id: z.uuid() });
export const employeeIdParamSchema = z.object({ employeeId: z.uuid() });

export const listPayrollRunsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  status: z.enum(Object.values(PAYROLL_STATUS) as [string, ...string[]]).optional(),
  year: z.coerce.number().int().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

export const createPayrollRunSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  departmentId: z.uuid().optional(),
  branchId: z.uuid().optional(),
});

export const processPayrollRunSchema = z.object({
  employeeIds: z.array(z.uuid()).optional(),
});

export const updatePoliciesSchema = z.object({
  calendarStartDay: z.number().int().min(1).max(28).optional(),
  lockAfterDays: z.number().int().min(0).optional(),
  approvalWorkflowSlug: z.string().optional(),
  revisionWorkflowSlug: z.string().optional(),
  statutoryPlugins: z.array(z.object({
    pluginId: z.string(),
    enabled: z.boolean(),
    config: z.record(z.string(), z.unknown()),
  })).optional(),
  overtimeRateMultiplier: z.number().min(0).optional(),
  lwpDeductionBasis: z.string().optional(),
  companyDisplayName: z.string().optional(),
});

export const createSalaryStructureSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  baseSalary: z.number().min(0),
  currency: z.string().optional(),
  components: z.array(z.object({
    name: z.string(),
    code: z.string(),
    type: z.enum(Object.values(SALARY_COMPONENT_TYPE) as [string, ...string[]]),
    category: z.enum(Object.values(PAYROLL_COMPONENT_CATEGORY) as [string, ...string[]]).optional(),
    amount: z.number().min(0),
    isTaxable: z.boolean(),
  })).optional(),
});

export const updateSalaryStructureSchema = createSalaryStructureSchema.partial().extend({
  status: z.string().optional(),
});

export const createComponentSchema = z.object({
  kind: z.enum(Object.values(PAYROLL_COMPONENT_KIND) as [string, ...string[]]),
  name: z.string().min(1),
  code: z.string().min(1),
  amount: z.number().min(0),
  type: z.enum(Object.values(SALARY_COMPONENT_TYPE) as [string, ...string[]]),
  category: z.enum(Object.values(PAYROLL_COMPONENT_CATEGORY) as [string, ...string[]]).optional(),
  isTaxable: z.boolean().optional(),
  isStatutory: z.boolean().optional(),
});

export const updateComponentSchema = createComponentSchema.partial().extend({
  status: z.string().optional(),
});

export const assignCompensationSchema = z.object({
  employeeId: z.uuid(),
  salaryStructureId: z.uuid(),
  baseSalary: z.number().min(0),
  currency: z.string().optional(),
  effectiveFrom: z.coerce.date(),
  componentOverrides: z.array(z.object({
    code: z.string(),
    amount: z.number().min(0),
    type: z.string().optional(),
  })).optional(),
});

export const updateCompensationSchema = z.object({
  baseSalary: z.number().min(0).optional(),
  currency: z.string().optional(),
  componentOverrides: z.array(z.object({
    code: z.string(),
    amount: z.number().min(0),
    type: z.string().optional(),
  })).optional(),
  status: z.string().optional(),
});

export const listCompensationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  employeeId: z.uuid().optional(),
  status: z.string().optional(),
});

export const listComponentsQuerySchema = z.object({
  category: z.enum(Object.values(PAYROLL_COMPONENT_CATEGORY) as [string, ...string[]]).optional(),
  kind: z.enum(Object.values(PAYROLL_COMPONENT_KIND) as [string, ...string[]]).optional(),
  status: z.string().optional(),
});

export const listSalaryStructuresQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  status: z.string().optional(),
});

export const createSalaryRevisionSchema = z.object({
  employeeId: z.uuid(),
  revisionType: z.enum(Object.values(SALARY_REVISION_TYPE) as [string, ...string[]]),
  salaryStructureId: z.uuid().optional(),
  newBaseSalary: z.number().min(0),
  effectiveFrom: z.coerce.date(),
  reason: z.string().min(1),
  submit: z.boolean().optional(),
});

export const updateSalaryRevisionSchema = z.object({
  revisionType: z.enum(Object.values(SALARY_REVISION_TYPE) as [string, ...string[]]).optional(),
  salaryStructureId: z.uuid().optional(),
  newBaseSalary: z.number().min(0).optional(),
  effectiveFrom: z.coerce.date().optional(),
  reason: z.string().min(1).optional(),
});

export const listSalaryRevisionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  employeeId: z.uuid().optional(),
  status: z.string().optional(),
});

export const listPayslipsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  payrollId: z.uuid().optional(),
  employeeId: z.uuid().optional(),
});

export const reportQuerySchema = z.object({
  type: z.enum(Object.values(PAYROLL_REPORT_TYPE) as [string, ...string[]]),
  year: z.coerce.number().int().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  departmentId: z.uuid().optional(),
  branchId: z.uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const dashboardQuerySchema = z.object({
  year: z.coerce.number().int().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

export const exceptionsQuerySchema = z.object({
  payrollId: z.uuid().optional(),
});
