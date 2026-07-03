import type { MasterDataEntityKey } from '@modules/organization/constants/organization.constants.js';
import { MASTER_DATA_ENTITY } from '@modules/organization/constants/organization.constants.js';

export interface CodeGenerationEntityConfig {
  /** App setting key for entity-specific prefix override */
  prefixSettingKey: string;
  defaultPrefix: string;
  /** Include slug derived from record name between prefix and sequence */
  slugFromName: boolean;
  /** Zero-pad length for running number segment */
  padLength: number;
  /** Include YY year segment */
  includeYear: boolean;
  /** Include MM month segment */
  includeMonth: boolean;
  /** Optional static suffix */
  suffix?: string;
}

export const GLOBAL_CODE_SETTINGS = {
  PAD_LENGTH: 'organization.code_pad_length',
  INCLUDE_YEAR: 'organization.code_include_year',
  INCLUDE_MONTH: 'organization.code_include_month',
} as const;

/** Master data entities that store a system `code` field */
export const CODE_GENERATION_REGISTRY: Partial<Record<MasterDataEntityKey, CodeGenerationEntityConfig>> = {
  [MASTER_DATA_ENTITY.BRANCH]: {
    prefixSettingKey: 'organization.branch_code_prefix',
    defaultPrefix: 'BR',
    slugFromName: false,
    padLength: 4,
    includeYear: false,
    includeMonth: false,
  },
  [MASTER_DATA_ENTITY.DEPARTMENT]: {
    prefixSettingKey: 'organization.department_code_prefix',
    defaultPrefix: 'DEPT',
    slugFromName: false,
    padLength: 3,
    includeYear: false,
    includeMonth: false,
  },
  [MASTER_DATA_ENTITY.DESIGNATION]: {
    prefixSettingKey: 'organization.designation_code_prefix',
    defaultPrefix: 'DESG',
    slugFromName: false,
    padLength: 3,
    includeYear: false,
    includeMonth: false,
  },

  [MASTER_DATA_ENTITY.OFFICE_LOCATION]: {
    prefixSettingKey: 'organization.office_location_code_prefix',
    defaultPrefix: 'LOC',
    slugFromName: false,
    padLength: 3,
    includeYear: false,
    includeMonth: false,
  },
  [MASTER_DATA_ENTITY.WORK_SHIFT]: {
    prefixSettingKey: 'organization.work_shift_code_prefix',
    defaultPrefix: 'SHIFT',
    slugFromName: false,
    padLength: 3,
    includeYear: false,
    includeMonth: false,
  },
  [MASTER_DATA_ENTITY.EMPLOYMENT_TYPE]: {
    prefixSettingKey: 'organization.employment_type_code_prefix',
    defaultPrefix: 'EMPT',
    slugFromName: false,
    padLength: 3,
    includeYear: false,
    includeMonth: false,
  },
  [MASTER_DATA_ENTITY.SALARY_GRADE]: {
    prefixSettingKey: 'organization.salary_grade_code_prefix',
    defaultPrefix: 'SG',
    slugFromName: false,
    padLength: 3,
    includeYear: false,
    includeMonth: false,
  },
  [MASTER_DATA_ENTITY.LEAVE_TYPE]: {
    prefixSettingKey: 'organization.leave_type_code_prefix',
    defaultPrefix: 'LV',
    slugFromName: false,
    padLength: 3,
    includeYear: false,
    includeMonth: false,
  },
  [MASTER_DATA_ENTITY.PROJECT_CATEGORY]: {
    prefixSettingKey: 'organization.project_category_code_prefix',
    defaultPrefix: 'PCAT',
    slugFromName: false,
    padLength: 3,
    includeYear: false,
    includeMonth: false,
  },
};

export function entitySupportsAutoCode(entityKey: MasterDataEntityKey): boolean {
  return entityKey in CODE_GENERATION_REGISTRY;
}

export function slugifyForCode(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
}
