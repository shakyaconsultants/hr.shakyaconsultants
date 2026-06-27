import { Schema, type SchemaDefinition } from 'mongoose';
import { defineDomainModel } from '@infrastructure/database/model.factory.js';
import { COLLECTIONS } from '@infrastructure/database/constants/collections.js';
import type { BaseDocument } from '@infrastructure/database/types/base-document.types.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';

export interface DepartmentDocument extends BaseDocument {
  name: string;
  code: string;
  description?: string;
  parentDepartmentId?: string;
  headEmployeeId?: string;
  branchId?: string;
  email?: string;
  internalNotes?: string;
  status: string;
}

export interface JobRoleDocument extends BaseDocument {
  name: string;
  code: string;
  description?: string;
  departmentId?: string;
  designationId?: string;
  employmentTypeId?: string;
  salaryGradeId?: string;
  requiredSkillIds: string[];
  responsibilities: string[];
  experienceMinYears?: number;
  experienceMaxYears?: number;
  level?: number;
  status: string;
}

export interface DesignationDocument extends BaseDocument {
  name: string;
  code: string;
  description?: string;
  hierarchyLevel?: number;
  salaryGradeId?: string;
  departmentId?: string;
  applicableJobRoleIds: string[];
  promotionDesignationId?: string;
  status: string;
}

export interface BranchDocument extends BaseDocument {
  name: string;
  code: string;
  phone?: string;
  email?: string;
  branchManagerId?: string;
  timezone: string;
  holidayCalendarId?: string;
  workShiftId?: string;
  attendancePolicy?: Record<string, unknown>;
  officeTimings?: Record<string, unknown>;
  biometricDeviceReady: boolean;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  status: string;
}

export interface OfficeLocationDocument extends BaseDocument {
  name: string;
  code: string;
  branchId?: string;
  timezone: string;
  isRemote: boolean;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  status: string;
}

export const HOLIDAY_TYPE = {
  PUBLIC: 'public',
  COMPANY: 'company',
  BRANCH: 'branch',
  OPTIONAL: 'optional',
  RECURRING: 'recurring',
} as const;

export interface HolidayDocument extends BaseDocument {
  name: string;
  date: Date;
  type: string;
  branchId?: string;
  officeLocationId?: string;
  isRecurring: boolean;
  recurrenceRule?: string;
  isOptional: boolean;
  description?: string;
  status: string;
}

export interface WorkShiftDocument extends BaseDocument {
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  gracePeriodMinutes: number;
  daysOfWeek: number[];
  isNightShift: boolean;
  isFlexible: boolean;
  weeklyOffDays: number[];
  attendanceRules?: Record<string, unknown>;
  status: string;
}

const departmentFields: SchemaDefinition = {
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  description: { type: String, trim: true },
  parentDepartmentId: { type: String, index: true },
  headEmployeeId: { type: String, index: true },
  branchId: { type: String, index: true },
  email: { type: String, trim: true, lowercase: true },
  internalNotes: { type: String, trim: true },
  status: { type: String, enum: Object.values(ENTITY_STATUS), default: ENTITY_STATUS.ACTIVE },
};

const jobRoleFields: SchemaDefinition = {
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  description: { type: String, trim: true },
  departmentId: { type: String, index: true },
  designationId: { type: String, index: true },
  employmentTypeId: { type: String, index: true },
  salaryGradeId: { type: String, index: true },
  requiredSkillIds: { type: [String], default: [] },
  responsibilities: { type: [String], default: [] },
  experienceMinYears: { type: Number, min: 0 },
  experienceMaxYears: { type: Number, min: 0 },
  level: { type: Number, min: 1 },
  status: { type: String, enum: Object.values(ENTITY_STATUS), default: ENTITY_STATUS.ACTIVE },
};

const designationFields: SchemaDefinition = {
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  description: { type: String, trim: true },
  hierarchyLevel: { type: Number, min: 1, max: 12, index: true },
  salaryGradeId: { type: String, index: true },
  departmentId: { type: String, index: true },
  applicableJobRoleIds: { type: [String], default: [] },
  promotionDesignationId: { type: String, index: true },
  status: { type: String, enum: Object.values(ENTITY_STATUS), default: ENTITY_STATUS.ACTIVE },
};

const branchFields: SchemaDefinition = {
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  phone: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  branchManagerId: { type: String, index: true },
  timezone: { type: String, default: 'Asia/Kolkata' },
  holidayCalendarId: { type: String, index: true },
  workShiftId: { type: String, index: true },
  attendancePolicy: { type: Schema.Types.Mixed, default: {} },
  officeTimings: { type: Schema.Types.Mixed, default: {} },
  biometricDeviceReady: { type: Boolean, default: false },
  address: {
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    postalCode: { type: String, required: true },
  },
  status: { type: String, enum: Object.values(ENTITY_STATUS), default: ENTITY_STATUS.ACTIVE },
};

const officeLocationFields: SchemaDefinition = {
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  branchId: { type: String, index: true },
  timezone: { type: String, default: 'Asia/Kolkata' },
  isRemote: { type: Boolean, default: false },
  address: {
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    postalCode: { type: String, required: true },
  },
  status: { type: String, enum: Object.values(ENTITY_STATUS), default: ENTITY_STATUS.ACTIVE },
};

const holidayFields: SchemaDefinition = {
  name: { type: String, required: true, trim: true },
  date: { type: Date, required: true, index: true },
  type: { type: String, enum: Object.values(HOLIDAY_TYPE), default: HOLIDAY_TYPE.PUBLIC },
  branchId: { type: String, index: true },
  officeLocationId: { type: String, index: true },
  isRecurring: { type: Boolean, default: false },
  recurrenceRule: { type: String, trim: true },
  isOptional: { type: Boolean, default: false },
  description: { type: String, trim: true },
  status: { type: String, enum: Object.values(ENTITY_STATUS), default: ENTITY_STATUS.ACTIVE },
};

const workShiftFields: SchemaDefinition = {
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  breakMinutes: { type: Number, default: 0, min: 0 },
  gracePeriodMinutes: { type: Number, default: 0, min: 0 },
  daysOfWeek: { type: [Number], default: [1, 2, 3, 4, 5] },
  isNightShift: { type: Boolean, default: false },
  isFlexible: { type: Boolean, default: false },
  weeklyOffDays: { type: [Number], default: [0, 6] },
  attendanceRules: { type: Schema.Types.Mixed, default: {} },
  status: { type: String, enum: Object.values(ENTITY_STATUS), default: ENTITY_STATUS.ACTIVE },
};

export const departmentModel = defineDomainModel<DepartmentDocument>(
  'Department',
  COLLECTIONS.DEPARTMENTS,
  departmentFields,
  {
    indexes: [
      { fields: { companyId: 1, code: 1 }, options: { unique: true, name: 'uq_departments_company_code' } },
      { fields: { companyId: 1, parentDepartmentId: 1, name: 1 }, options: { name: 'idx_departments_company_parent_name' } },
      { fields: { companyId: 1, status: 1 }, options: { name: 'idx_departments_company_status' } },
    ],
  },
);

export const jobRoleModel = defineDomainModel<JobRoleDocument>(
  'JobRole',
  COLLECTIONS.JOB_ROLES,
  jobRoleFields,
  {
    indexes: [
      { fields: { companyId: 1, code: 1 }, options: { unique: true, name: 'uq_job_roles_company_code' } },
      { fields: { companyId: 1, departmentId: 1 }, options: { name: 'idx_job_roles_company_department' } },
    ],
  },
);

export const designationModel = defineDomainModel<DesignationDocument>(
  'Designation',
  COLLECTIONS.DESIGNATIONS,
  designationFields,
  {
    indexes: [
      { fields: { companyId: 1, code: 1 }, options: { unique: true, name: 'uq_designations_company_code' } },
      { fields: { companyId: 1, departmentId: 1, name: 1 }, options: { name: 'idx_designations_company_department_name' } },
      { fields: { companyId: 1, status: 1 }, options: { name: 'idx_designations_company_status' } },
    ],
  },
);

export const branchModel = defineDomainModel<BranchDocument>(
  'Branch',
  COLLECTIONS.BRANCHES,
  branchFields,
  {
    indexes: [
      { fields: { companyId: 1, code: 1 }, options: { unique: true, name: 'uq_branches_company_code' } },
      { fields: { companyId: 1, status: 1 }, options: { name: 'idx_branches_company_status' } },
    ],
  },
);

export const officeLocationModel = defineDomainModel<OfficeLocationDocument>(
  'OfficeLocation',
  COLLECTIONS.OFFICE_LOCATIONS,
  officeLocationFields,
  {
    indexes: [
      { fields: { companyId: 1, code: 1 }, options: { unique: true, name: 'uq_office_locations_company_code' } },
      { fields: { companyId: 1, branchId: 1 }, options: { name: 'idx_office_locations_company_branch' } },
    ],
  },
);

export const holidayModel = defineDomainModel<HolidayDocument>(
  'Holiday',
  COLLECTIONS.HOLIDAYS,
  holidayFields,
  {
    indexes: [
      { fields: { companyId: 1, date: 1 }, options: { name: 'idx_holidays_company_date' } },
      { fields: { companyId: 1, branchId: 1, date: 1 }, options: { name: 'idx_holidays_company_branch_date' } },
    ],
  },
);

export const workShiftModel = defineDomainModel<WorkShiftDocument>(
  'WorkShift',
  COLLECTIONS.WORK_SHIFTS,
  workShiftFields,
  {
    indexes: [
      { fields: { companyId: 1, code: 1 }, options: { unique: true, name: 'uq_work_shifts_company_code' } },
      { fields: { companyId: 1, status: 1 }, options: { name: 'idx_work_shifts_company_status' } },
    ],
  },
);

export const DepartmentModel = departmentModel.model;
export const JobRoleModel = jobRoleModel.model;
export const DesignationModel = designationModel.model;
export const BranchModel = branchModel.model;
export const OfficeLocationModel = officeLocationModel.model;
export const HolidayModel = holidayModel.model;
export const WorkShiftModel = workShiftModel.model;

export const DepartmentRepository = departmentModel.repository;
export const JobRoleRepository = jobRoleModel.repository;
export const DesignationRepository = designationModel.repository;
export const BranchRepository = branchModel.repository;
export const OfficeLocationRepository = officeLocationModel.repository;
export const HolidayRepository = holidayModel.repository;
export const WorkShiftRepository = workShiftModel.repository;
