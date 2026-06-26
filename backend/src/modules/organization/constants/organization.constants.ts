export const ORGANIZATION_ROUTES = {
  BASE: '/organization',
  COMPANY: '/company',
  ENTITIES: '/entities',
  BULK: '/bulk',
  EXPORT: '/export',
  IMPORT: '/import',
} as const;

export const SETTINGS_ROUTES = {
  BASE: '/settings',
  PUBLIC: '/public',
  GROUP: '/group',
  SECTIONS: '/sections',
  CATALOG: '/catalog',
  SEED_DEFAULTS: '/seed-defaults',
  HISTORY: '/history',
  FEATURE_FLAGS: '/feature-flags',
  NAVIGATION: '/navigation',
  AUDIT: '/audit',
  SYSTEM_HEALTH: '/system/health',
  EMAIL_TEST: '/email/test',
} as const;

export const ORGANIZATION_AUDIT_WHERE = {
  ORGANIZATION: 'organization',
  SETTINGS: 'settings',
} as const;

export const MASTER_DATA_ENTITY = {
  BRANCH: 'branch',
  DEPARTMENT: 'department',
  DESIGNATION: 'designation',
  JOB_ROLE: 'job-role',
  OFFICE_LOCATION: 'office-location',
  WORK_SHIFT: 'work-shift',
  HOLIDAY: 'holiday',
  EMPLOYMENT_TYPE: 'employment-type',
  SALARY_GRADE: 'salary-grade',
  LEAVE_TYPE: 'leave-type',
  PROJECT_CATEGORY: 'project-category',
  TECHNOLOGY: 'technology',
  SKILL: 'skill',
} as const;

export type MasterDataEntityKey = (typeof MASTER_DATA_ENTITY)[keyof typeof MASTER_DATA_ENTITY];
