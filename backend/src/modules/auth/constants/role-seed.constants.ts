export const SUPER_ADMIN_ROLE = {
  slug: 'super-admin',
  name: 'Super Admin',
  description: 'Full system access with all permissions',
  isSystem: true,
} as const;

export const DIRECTOR_ROLE = {
  slug: 'director',
  name: 'Director',
  description: 'Executive access with broad read and operational permissions',
  isSystem: true,
} as const;

export const BOOTSTRAP_ORG_DEFAULTS = {
  DEPARTMENT_CODE: 'ADMIN',
  DEPARTMENT_NAME: 'Administration',
  DESIGNATION_CODE: 'SYSADMIN',
  DESIGNATION_NAME: 'System Administrator',
  BRANCH_CODE: 'HQ',
  BRANCH_NAME: 'Head Office',
  EMPLOYEE_NUMBER: 'EMP001',
} as const;
