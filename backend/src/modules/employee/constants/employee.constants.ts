export const EMPLOYEE_ROUTES = {
  BASE: '/employees',
  EXPORT: '/export',
  IMPORT: '/import',
  BULK: '/bulk',
  SEARCH: '/search',
} as const;

export const EMPLOYEE_AUDIT_WHERE = 'employee' as const;

export const EMPLOYEE_NUMBER_SEQUENCE_KEY = 'employee_number' as const;

export const DEFAULT_EMPLOYEE_NUMBER_PREFIX = 'EMP' as const;

export const EMPLOYEE_SETTINGS_KEYS = {
  NUMBER_PREFIX: 'employee.number_prefix',
  NUMBER_PAD_LENGTH: 'employee.number_pad_length',
} as const;

export const EMPLOYEE_BULK_ACTION = {
  ARCHIVE: 'archive',
  RESTORE: 'restore',
  DEACTIVATE: 'deactivate',
  REACTIVATE: 'reactivate',
  DELETE: 'delete',
} as const;

/** Default portal password for newly created employees (admin can override on create). */
export const DEFAULT_EMPLOYEE_TEMP_PASSWORD = 'welcome1' as const;
