export const RBAC_ROUTES = {
  BASE: '/rbac',
  PERMISSIONS: '/permissions',
  PERMISSION_GROUPS: '/permission-groups',
  PERMISSION_CATEGORIES: '/permission-categories',
  ROLES: '/roles',
  ROLE_GROUPS: '/role-groups',
  ROLE_TEMPLATES: '/role-templates',
  ASSIGNMENTS: '/assignments',
  SIMULATOR: '/simulator',
  MATRIX: '/matrix',
  EFFECTIVE: '/effective-permissions',
  APPROVAL_HIERARCHY: '/approval-hierarchy',
  REPORTING_HIERARCHY: '/reporting-hierarchy',
} as const;

export const RBAC_AUDIT_WHERE = 'rbac' as const;

export const SYSTEM_ROLE_SLUG = {
  SUPER_ADMIN: 'super-admin',
  DIRECTOR: 'director',
  HR: 'hr',
  PROJECT_MANAGER: 'project-manager',
  SALES_MANAGER: 'sales-manager',
  FINANCE: 'finance',
  EMPLOYEE: 'employee',
  INTERN: 'intern',
} as const;

export type SystemRoleSlug = (typeof SYSTEM_ROLE_SLUG)[keyof typeof SYSTEM_ROLE_SLUG];

export const PROTECTED_SYSTEM_ROLES: SystemRoleSlug[] = [
  SYSTEM_ROLE_SLUG.SUPER_ADMIN,
];
