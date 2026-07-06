import { Schema, type SchemaDefinition } from 'mongoose';
import { defineDomainModel } from '@infrastructure/database/model.factory.js';
import { COLLECTIONS } from '@infrastructure/database/constants/collections.js';
import type { BaseDocument } from '@infrastructure/database/types/base-document.types.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';

export const SETTING_VALUE_TYPE = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  JSON: 'json',
  ENCRYPTED: 'encrypted',
} as const;

export const SETTING_GROUP = {
  GENERAL: 'general',
  COMPANY: 'company',
  ORGANIZATION: 'organization',
  ATTENDANCE: 'attendance',
  PAYROLL: 'payroll',
  LEAVE: 'leave',
  PROJECTS: 'projects',
  RECRUITMENT: 'recruitment',
  NOTIFICATIONS: 'notifications',
  SMTP: 'smtp',
  EMAIL: 'email',
  SECURITY: 'security',
  BRANDING: 'branding',
  STORAGE: 'storage',
  INTEGRATIONS: 'integrations',
  SALES: 'sales',
  COMMUNICATION: 'communication',
  REPORTS: 'reports',
  FEATURE_FLAGS: 'feature_flags',
  ANALYTICS: 'analytics',
  API: 'api',
  SYSTEM: 'system',
  NAVIGATION: 'navigation',
} as const;

export interface SalaryGradeDocument extends BaseDocument {
  name: string;
  code: string;
  level: number;
  minSalary?: number;
  maxSalary?: number;
  currency: string;
  description?: string;
  status: string;
}

export interface LeaveTypeDocument extends BaseDocument {
  name: string;
  code: string;
  description?: string;
  isPaid: boolean;
  maxDaysPerYear?: number;
  carryForward: boolean;
  isDefault: boolean;
  color?: string;
  status: string;
}

export interface ProjectCategoryDocument extends BaseDocument {
  name: string;
  code: string;
  description?: string;
  color?: string;
  status: string;
}

export interface TechnologyDocument extends BaseDocument {
  name: string;
  code: string;
  category?: string;
  description?: string;
  status: string;
}

export interface SkillDocument extends BaseDocument {
  name: string;
  code: string;
  category?: string;
  description?: string;
  technologyIds: string[];
  status: string;
}

export interface AppSettingDocument extends BaseDocument {
  key: string;
  name?: string;
  category?: string;
  value: unknown;
  valueType: string;
  defaultValue?: unknown;
  group: string;
  description?: string;
  isEditable: boolean;
  isPublic: boolean;
  validation?: Record<string, unknown>;
  encrypted: boolean;
}

export interface SettingVersionDocument extends BaseDocument {
  settingId: string;
  settingKey: string;
  value: unknown;
  valueType: string;
  version: number;
  changedBy: string;
  changeReason?: string;
  createdAt: Date;
}

const salaryGradeFields: SchemaDefinition = {
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  level: { type: Number, required: true, min: 1 },
  minSalary: { type: Number, min: 0 },
  maxSalary: { type: Number, min: 0 },
  currency: { type: String, default: 'INR' },
  description: { type: String, trim: true },
  status: { type: String, enum: Object.values(ENTITY_STATUS), default: ENTITY_STATUS.ACTIVE },
};

const leaveTypeFields: SchemaDefinition = {
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  description: { type: String, trim: true },
  isPaid: { type: Boolean, default: true },
  maxDaysPerYear: { type: Number, min: 0 },
  carryForward: { type: Boolean, default: false },
  isDefault: { type: Boolean, default: false },
  color: { type: String, trim: true },
  status: { type: String, enum: Object.values(ENTITY_STATUS), default: ENTITY_STATUS.ACTIVE },
};

const projectCategoryFields: SchemaDefinition = {
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  description: { type: String, trim: true },
  color: { type: String, trim: true },
  status: { type: String, enum: Object.values(ENTITY_STATUS), default: ENTITY_STATUS.ACTIVE },
};

const technologyFields: SchemaDefinition = {
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  category: { type: String, trim: true, index: true },
  description: { type: String, trim: true },
  status: { type: String, enum: Object.values(ENTITY_STATUS), default: ENTITY_STATUS.ACTIVE },
};

const skillFields: SchemaDefinition = {
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  category: { type: String, trim: true, index: true },
  description: { type: String, trim: true },
  technologyIds: { type: [String], default: [] },
  status: { type: String, enum: Object.values(ENTITY_STATUS), default: ENTITY_STATUS.ACTIVE },
};

const appSettingFields: SchemaDefinition = {
  key: { type: String, required: true, trim: true, lowercase: true },
  name: { type: String, trim: true },
  category: { type: String, trim: true, index: true },
  value: { type: Schema.Types.Mixed, default: null },
  valueType: {
    type: String,
    enum: Object.values(SETTING_VALUE_TYPE),
    default: SETTING_VALUE_TYPE.STRING,
  },
  defaultValue: { type: Schema.Types.Mixed, default: null },
  group: { type: String, enum: Object.values(SETTING_GROUP), required: true, index: true },
  description: { type: String, trim: true },
  isEditable: { type: Boolean, default: true },
  isPublic: { type: Boolean, default: false },
  validation: { type: Schema.Types.Mixed, default: {} },
  encrypted: { type: Boolean, default: false },
};

const settingVersionFields: SchemaDefinition = {
  settingId: { type: String, required: true, index: true },
  settingKey: { type: String, required: true, trim: true, lowercase: true, index: true },
  value: { type: Schema.Types.Mixed, default: null },
  valueType: { type: String, enum: Object.values(SETTING_VALUE_TYPE), required: true },
  version: { type: Number, required: true, min: 1 },
  changedBy: { type: String, required: true },
  changeReason: { type: String, trim: true },
  createdAt: { type: Date, required: true, default: Date.now, index: true },
};

const codeUniqueIndex = (prefix: string) =>
  [
    {
      fields: { companyId: 1, code: 1 },
      options: { unique: true, name: `uq_${prefix}_company_code` },
    },
    { fields: { companyId: 1, status: 1 }, options: { name: `idx_${prefix}_company_status` } },
  ] as const;

export const salaryGradeModel = defineDomainModel<SalaryGradeDocument>(
  'SalaryGrade',
  COLLECTIONS.SALARY_GRADES,
  salaryGradeFields,
  { searchFields: ['name', 'code'], indexes: [...codeUniqueIndex('salary_grades')] },
);

export const leaveTypeModel = defineDomainModel<LeaveTypeDocument>(
  'LeaveType',
  COLLECTIONS.LEAVE_TYPES,
  leaveTypeFields,
  { searchFields: ['name', 'code'], indexes: [...codeUniqueIndex('leave_types')] },
);

export const projectCategoryModel = defineDomainModel<ProjectCategoryDocument>(
  'ProjectCategory',
  COLLECTIONS.PROJECT_CATEGORIES,
  projectCategoryFields,
  { searchFields: ['name', 'code'], indexes: [...codeUniqueIndex('project_categories')] },
);

export const technologyModel = defineDomainModel<TechnologyDocument>(
  'Technology',
  COLLECTIONS.TECHNOLOGIES,
  technologyFields,
  { searchFields: ['name', 'code', 'category'], indexes: [...codeUniqueIndex('technologies')] },
);

export const skillModel = defineDomainModel<SkillDocument>(
  'Skill',
  COLLECTIONS.SKILLS,
  skillFields,
  { searchFields: ['name', 'code', 'category'], indexes: [...codeUniqueIndex('skills')] },
);

export const appSettingModel = defineDomainModel<AppSettingDocument>(
  'AppSetting',
  COLLECTIONS.APP_SETTINGS,
  appSettingFields,
  {
    indexes: [
      {
        fields: { companyId: 1, key: 1 },
        options: { unique: true, name: 'uq_app_settings_company_key' },
      },
      { fields: { companyId: 1, group: 1 }, options: { name: 'idx_app_settings_company_group' } },
      {
        fields: { companyId: 1, isPublic: 1 },
        options: { name: 'idx_app_settings_company_public' },
      },
    ],
  },
);

export const SalaryGradeRepository = salaryGradeModel.repository;
export const LeaveTypeRepository = leaveTypeModel.repository;
export const ProjectCategoryRepository = projectCategoryModel.repository;
export const TechnologyRepository = technologyModel.repository;
export const SkillRepository = skillModel.repository;
export const settingVersionModel = defineDomainModel<SettingVersionDocument>(
  'SettingVersion',
  COLLECTIONS.SETTING_VERSIONS,
  settingVersionFields,
  {
    withSoftDelete: false,
    withVersioning: false,
    indexes: [
      {
        fields: { companyId: 1, settingKey: 1, version: -1 },
        options: { name: 'idx_setting_versions_company_key_version' },
      },
      {
        fields: { companyId: 1, settingId: 1, version: -1 },
        options: { name: 'idx_setting_versions_company_setting_version' },
      },
    ],
  },
);

export const AppSettingRepository = appSettingModel.repository;
export const SettingVersionRepository = settingVersionModel.repository;
