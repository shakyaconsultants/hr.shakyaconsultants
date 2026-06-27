import { z } from 'zod';
import { listEntityKeys } from '@modules/organization/constants/entity-registry.constants.js';

const entityKeySchema = z.enum(listEntityKeys() as [string, ...string[]]);

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  includeDeleted: z.coerce.boolean().optional(),
  branchId: z.uuid().optional(),
  departmentId: z.uuid().optional(),
  parentDepartmentId: z.union([z.uuid(), z.literal('root')]).optional(),
  headEmployeeId: z.uuid().optional(),
  salaryGradeId: z.uuid().optional(),
  hierarchyLevel: z.coerce.number().int().min(1).max(12).optional(),
  type: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  cursor: z.string().optional(),
  useCursor: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const entityKeyParamSchema = z.object({
  entityKey: entityKeySchema,
});

export const idParamSchema = z.object({
  entityKey: entityKeySchema,
  id: z.uuid(),
});

export const createBodySchema = z.object({
  data: z.record(z.string(), z.unknown()),
});

export const updateBodySchema = z.object({
  data: z.record(z.string(), z.unknown()),
});

export const bulkCreateSchema = z.object({
  items: z.array(z.record(z.string(), z.unknown())).min(1).max(500),
});

export const bulkUpdateSchema = z.object({
  items: z.array(z.object({
    id: z.uuid(),
    data: z.record(z.string(), z.unknown()),
  })).min(1).max(500),
});

export const bulkDeleteSchema = z.object({
  ids: z.array(z.uuid()).min(1).max(500),
});

export const csvImportSchema = z.object({
  csv: z.string().min(1),
});

export const companyUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  legalName: z.string().min(1).optional(),
  email: z.email().optional(),
  phone: z.string().min(1).optional(),
  website: z.url().optional(),
  taxId: z.string().optional(),
  registrationNumber: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  fiscalYearStart: z.string().optional(),
  logoUrl: z.url().optional(),
  address: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    country: z.string().min(1),
    postalCode: z.string().min(1),
  }).optional(),
});

export type ListQueryInput = z.infer<typeof listQuerySchema>;
export type CompanyUpdateInput = z.infer<typeof companyUpdateSchema>;
