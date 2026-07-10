import { z } from 'zod';
import {
  DEFAULT_EMPLOYEE_TEMP_PASSWORD,
  EMPLOYEE_BULK_ACTION,
} from '@modules/employee/constants/employee.constants.js';
import {
  DOCUMENT_TYPE,
  EMPLOYEE_EMPLOYMENT_STATUS,
  EMPLOYMENT_TYPE,
  GENDER,
  REPORTING_RELATIONSHIP_TYPE,
} from '@domain/employee/employee.schemas.js';

function optionalUuid() {
  return z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.uuid().optional(),
  );
}

const addressSchema = z
  .object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().min(1),
  })
  .optional();

export const idParamSchema = z.object({ id: z.uuid() });

export const employeeIdParamSchema = z.object({ employeeId: z.uuid() });

export const subResourceIdParamSchema = z.object({
  employeeId: z.uuid(),
  id: z.uuid(),
});

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  employmentStatus: z
    .enum(Object.values(EMPLOYEE_EMPLOYMENT_STATUS) as [string, ...string[]])
    .optional(),
  departmentId: optionalUuid(),
  branchId: optionalUuid(),
  designationId: optionalUuid(),
  reportingManagerId: z.uuid().optional(),
  includeDeleted: z.coerce.boolean().optional(),
  includeArchived: z.coerce.boolean().optional(),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

function optionalTrimmedString() {
  return z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().optional(),
  );
}

export const adminCreateEmployeeSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.email(),
  phone: optionalTrimmedString(),
  departmentId: z.uuid(),
  designationId: z.uuid(),
  branchId: optionalUuid(),
  reportingManagerId: optionalUuid(),
  joinedAt: z.coerce.date(),
  employmentType: z.enum(Object.values(EMPLOYMENT_TYPE) as [string, ...string[]]).optional(),
  employmentStatus: z
    .enum(Object.values(EMPLOYEE_EMPLOYMENT_STATUS) as [string, ...string[]])
    .optional(),
  temporaryPassword: z.string().trim().min(6).max(128).default(DEFAULT_EMPLOYEE_TEMP_PASSWORD),
});

export const createEmployeeSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.email(),
  phone: z.string().optional(),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.enum(Object.values(GENDER) as [string, ...string[]]).optional(),
  bloodGroup: z.string().optional(),
  nationality: z.string().optional(),
  maritalStatus: z.string().optional(),
  languages: z.array(z.string()).optional(),
  permanentAddress: addressSchema,
  communicationAddress: addressSchema,
  aadhaarNumber: optionalTrimmedString(),
  panNumber: optionalTrimmedString(),
  departmentId: z.uuid(),
  designationId: z.uuid(),
  branchId: optionalUuid(),
  shiftId: optionalUuid(),
  employmentTypeId: optionalUuid(),
  reportingManagerId: optionalUuid(),
  dottedManagerId: optionalUuid(),
  joinedAt: z.coerce.date(),
  probationEndDate: z.coerce.date().optional(),
  confirmationDate: z.coerce.date().optional(),
  employmentType: z.enum(Object.values(EMPLOYMENT_TYPE) as [string, ...string[]]).optional(),
  employmentStatus: z
    .enum(Object.values(EMPLOYEE_EMPLOYMENT_STATUS) as [string, ...string[]])
    .optional(),
  temporaryPassword: z.string().min(6).optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

export const bulkActionSchema = z.object({
  ids: z.array(z.uuid()).min(1),
  action: z.enum(Object.values(EMPLOYEE_BULK_ACTION) as [string, ...string[]]),
});

export const emergencyContactSchema = z.object({
  name: z.string().min(1),
  relationship: z.string().min(1),
  phone: z.string().min(1),
  email: z.email().optional(),
  isPrimary: z.boolean().optional(),
});

export const educationSchema = z.object({
  institution: z.string().min(1),
  university: z.string().optional(),
  degree: z.string().min(1),
  fieldOfStudy: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  year: z.coerce.number().int().optional(),
  grade: z.string().optional(),
  percentage: z.coerce.number().min(0).max(100).optional(),
  cgpa: z.coerce.number().min(0).max(10).optional(),
  documentId: z.uuid().optional(),
});

export const experienceSchema = z.object({
  company: z.string().min(1),
  title: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  description: z.string().optional(),
  responsibilities: z.string().optional(),
  experienceLetterDocumentId: z.uuid().optional(),
});

export const bankDetailsSchema = z.object({
  accountHolderName: z.string().min(1),
  bankName: z.string().min(1),
  accountNumber: z.string().min(1),
  ifscCode: z.string().min(1),
  upiId: z.string().optional(),
  branchName: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

export const skillSchema = z.object({
  skillId: z.uuid(),
  skillName: z.string().min(1),
  level: z.string().optional(),
  yearsExperience: z.coerce.number().min(0).optional(),
  isPrimary: z.boolean().optional(),
  isSecondary: z.boolean().optional(),
});

export const certificationSchema = z.object({
  name: z.string().min(1),
  issuedBy: z.string().min(1),
  issuedAt: z.coerce.date(),
  expiresAt: z.coerce.date().optional(),
  credentialId: z.string().optional(),
  documentId: z.uuid().optional(),
  reminderEnabled: z.boolean().optional(),
});

export const assetSchema = z.object({
  assetType: z.string().min(1),
  assetTag: z.string().min(1),
  name: z.string().min(1),
  condition: z.string().optional(),
  assignedAt: z.coerce.date().optional(),
});

export const assignManagerSchema = z.object({
  managerId: z.uuid(),
  relationshipType: z.enum(Object.values(REPORTING_RELATIONSHIP_TYPE) as [string, ...string[]]),
  isPrimary: z.boolean().optional(),
});

export const documentUploadMetaSchema = z.object({
  documentType: z.enum(Object.values(DOCUMENT_TYPE) as [string, ...string[]]),
  expiryDate: z.coerce.date().optional(),
});

export const signedUploadParamsSchema = z.object({
  documentType: z.enum(Object.values(DOCUMENT_TYPE) as [string, ...string[]]),
});

export const returnAssetSchema = z.object({
  condition: z.string().optional(),
});

export const importCsvSchema = z.object({
  content: z.string().min(1),
});

export const sendActivationEmailSchema = z
  .object({
    temporaryPassword: z.string().trim().min(6).max(128),
  })
  .strict();

export const setPortalPasswordSchema = z
  .object({
    password: z.string().trim().min(6).max(128),
  })
  .strict();
