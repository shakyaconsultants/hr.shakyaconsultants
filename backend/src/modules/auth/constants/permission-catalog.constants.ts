export interface PermissionCatalogEntry {
  code: string;
  name: string;
  module: string;
  action: string;
  groupSlug: string;
}

export const PERMISSION_MODULES = {
  AUTH: 'auth',
  COMPANY: 'company',
  EMPLOYEE: 'employee',
  ORGANIZATION: 'organization',
  SETTINGS: 'settings',
} as const;

export const PERMISSION_GROUPS = {
  AUTH: 'auth',
  COMPANY: 'company',
  EMPLOYEE: 'employee',
  ORGANIZATION: 'organization',
  SETTINGS: 'settings',
} as const;

export const PERMISSION_CATALOG: PermissionCatalogEntry[] = [
  // Auth
  {
    code: 'auth:login',
    name: 'Login',
    module: PERMISSION_MODULES.AUTH,
    action: 'login',
    groupSlug: PERMISSION_GROUPS.AUTH,
  },
  {
    code: 'auth:logout',
    name: 'Logout',
    module: PERMISSION_MODULES.AUTH,
    action: 'logout',
    groupSlug: PERMISSION_GROUPS.AUTH,
  },
  {
    code: 'auth:manage_sessions',
    name: 'Manage Sessions',
    module: PERMISSION_MODULES.AUTH,
    action: 'manage_sessions',
    groupSlug: PERMISSION_GROUPS.AUTH,
  },
  {
    code: 'auth:view_users',
    name: 'View Users',
    module: PERMISSION_MODULES.AUTH,
    action: 'view',
    groupSlug: PERMISSION_GROUPS.AUTH,
  },
  {
    code: 'auth:manage_users',
    name: 'Manage Users',
    module: PERMISSION_MODULES.AUTH,
    action: 'manage',
    groupSlug: PERMISSION_GROUPS.AUTH,
  },
  {
    code: 'auth:view_roles',
    name: 'View Roles',
    module: PERMISSION_MODULES.AUTH,
    action: 'view_roles',
    groupSlug: PERMISSION_GROUPS.AUTH,
  },
  {
    code: 'auth:manage_roles',
    name: 'Manage Roles',
    module: PERMISSION_MODULES.AUTH,
    action: 'manage_roles',
    groupSlug: PERMISSION_GROUPS.AUTH,
  },
  {
    code: 'auth:view_permissions',
    name: 'View Permissions',
    module: PERMISSION_MODULES.AUTH,
    action: 'view_permissions',
    groupSlug: PERMISSION_GROUPS.AUTH,
  },
  {
    code: 'auth:manage_permissions',
    name: 'Manage Permissions',
    module: PERMISSION_MODULES.AUTH,
    action: 'manage_permissions',
    groupSlug: PERMISSION_GROUPS.AUTH,
  },

  // Company
  {
    code: 'company:view',
    name: 'View Company',
    module: PERMISSION_MODULES.COMPANY,
    action: 'view',
    groupSlug: PERMISSION_GROUPS.COMPANY,
  },
  {
    code: 'company:update',
    name: 'Update Company',
    module: PERMISSION_MODULES.COMPANY,
    action: 'update',
    groupSlug: PERMISSION_GROUPS.COMPANY,
  },
  {
    code: 'company:manage_settings',
    name: 'Manage Company Settings',
    module: PERMISSION_MODULES.COMPANY,
    action: 'manage_settings',
    groupSlug: PERMISSION_GROUPS.COMPANY,
  },

  // Employee
  {
    code: 'employee:view',
    name: 'View Employees',
    module: PERMISSION_MODULES.EMPLOYEE,
    action: 'view',
    groupSlug: PERMISSION_GROUPS.EMPLOYEE,
  },
  {
    code: 'employee:create',
    name: 'Create Employees',
    module: PERMISSION_MODULES.EMPLOYEE,
    action: 'create',
    groupSlug: PERMISSION_GROUPS.EMPLOYEE,
  },
  {
    code: 'employee:update',
    name: 'Update Employees',
    module: PERMISSION_MODULES.EMPLOYEE,
    action: 'update',
    groupSlug: PERMISSION_GROUPS.EMPLOYEE,
  },
  {
    code: 'employee:delete',
    name: 'Delete Employees',
    module: PERMISSION_MODULES.EMPLOYEE,
    action: 'delete',
    groupSlug: PERMISSION_GROUPS.EMPLOYEE,
  },
  {
    code: 'employee:export',
    name: 'Export Employees',
    module: PERMISSION_MODULES.EMPLOYEE,
    action: 'export',
    groupSlug: PERMISSION_GROUPS.EMPLOYEE,
  },

  // Organization
  {
    code: 'organization:view_departments',
    name: 'View Departments',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'view_departments',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'organization:manage_departments',
    name: 'Manage Departments',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'manage_departments',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'organization:view_designations',
    name: 'View Designations',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'view_designations',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'organization:manage_designations',
    name: 'Manage Designations',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'manage_designations',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'organization:view_branches',
    name: 'View Branches',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'view_branches',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'organization:manage_branches',
    name: 'Manage Branches',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'manage_branches',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'organization:view_holidays',
    name: 'View Holidays',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'view_holidays',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'organization:manage_holidays',
    name: 'Manage Holidays',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'manage_holidays',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },

  // Organization — dot notation (master data module)
  {
    code: 'company.read',
    name: 'Read Company',
    module: PERMISSION_MODULES.COMPANY,
    action: 'read',
    groupSlug: PERMISSION_GROUPS.COMPANY,
  },
  {
    code: 'company.update',
    name: 'Update Company',
    module: PERMISSION_MODULES.COMPANY,
    action: 'update',
    groupSlug: PERMISSION_GROUPS.COMPANY,
  },
  {
    code: 'branch.read',
    name: 'Read Branches',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'read',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'branch.create',
    name: 'Create Branches',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'create',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'branch.update',
    name: 'Update Branches',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'update',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'branch.delete',
    name: 'Delete Branches',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'delete',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'department.read',
    name: 'Read Departments',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'read',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'department.create',
    name: 'Create Departments',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'create',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'department.update',
    name: 'Update Departments',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'update',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'department.delete',
    name: 'Delete Departments',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'delete',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'designation.read',
    name: 'Read Designations',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'read',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'designation.create',
    name: 'Create Designations',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'create',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'designation.update',
    name: 'Update Designations',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'update',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'designation.delete',
    name: 'Delete Designations',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'delete',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'office-location.read',
    name: 'Read Office Locations',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'read',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'office-location.create',
    name: 'Create Office Locations',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'create',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'office-location.update',
    name: 'Update Office Locations',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'update',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'office-location.delete',
    name: 'Delete Office Locations',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'delete',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'work-shift.read',
    name: 'Read Work Shifts',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'read',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'work-shift.create',
    name: 'Create Work Shifts',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'create',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'work-shift.update',
    name: 'Update Work Shifts',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'update',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'work-shift.delete',
    name: 'Delete Work Shifts',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'delete',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'holiday.read',
    name: 'Read Holidays',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'read',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'holiday.create',
    name: 'Create Holidays',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'create',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'holiday.update',
    name: 'Update Holidays',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'update',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'holiday.delete',
    name: 'Delete Holidays',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'delete',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'salary-grade.read',
    name: 'Read Salary Grades',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'read',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'salary-grade.create',
    name: 'Create Salary Grades',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'create',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'salary-grade.update',
    name: 'Update Salary Grades',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'update',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'salary-grade.delete',
    name: 'Delete Salary Grades',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'delete',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'leave-type.read',
    name: 'Read Leave Types',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'read',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'leave-type.create',
    name: 'Create Leave Types',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'create',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'leave-type.update',
    name: 'Update Leave Types',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'update',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'leave-type.delete',
    name: 'Delete Leave Types',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'delete',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'project-category.read',
    name: 'Read Project Categories',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'read',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'project-category.create',
    name: 'Create Project Categories',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'create',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'project-category.update',
    name: 'Update Project Categories',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'update',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'project-category.delete',
    name: 'Delete Project Categories',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'delete',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'technology.read',
    name: 'Read Technologies',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'read',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'technology.create',
    name: 'Create Technologies',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'create',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'technology.update',
    name: 'Update Technologies',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'update',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'technology.delete',
    name: 'Delete Technologies',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'delete',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'skill.read',
    name: 'Read Skills',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'read',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'skill.create',
    name: 'Create Skills',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'create',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'skill.update',
    name: 'Update Skills',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'update',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'skill.delete',
    name: 'Delete Skills',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'delete',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'organization.bulk',
    name: 'Bulk Organization Operations',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'bulk',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'organization.export',
    name: 'Export Organization Data',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'export',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },
  {
    code: 'organization.import',
    name: 'Import Organization Data',
    module: PERMISSION_MODULES.ORGANIZATION,
    action: 'import',
    groupSlug: PERMISSION_GROUPS.ORGANIZATION,
  },

  // Settings
  {
    code: 'settings.read',
    name: 'Read Settings',
    module: PERMISSION_MODULES.SETTINGS,
    action: 'read',
    groupSlug: PERMISSION_GROUPS.SETTINGS,
  },
  {
    code: 'settings.manage',
    name: 'Manage Settings',
    module: PERMISSION_MODULES.SETTINGS,
    action: 'manage',
    groupSlug: PERMISSION_GROUPS.SETTINGS,
  },
];

const LEGACY_DIRECTOR_CODES = PERMISSION_CATALOG.filter(
  (entry) =>
    entry.module !== PERMISSION_MODULES.AUTH ||
    entry.action === 'view' ||
    entry.action === 'view_roles' ||
    entry.action === 'view_permissions',
).map((entry) => entry.code);

const ORG_READ_DOT_CODES = PERMISSION_CATALOG.filter(
  (entry) =>
    entry.code.endsWith('.read') &&
    (entry.module === PERMISSION_MODULES.ORGANIZATION ||
      entry.module === PERMISSION_MODULES.COMPANY ||
      entry.module === PERMISSION_MODULES.SETTINGS),
).map((entry) => entry.code);

export const DIRECTOR_PERMISSION_CODES: string[] = [
  ...new Set([...LEGACY_DIRECTOR_CODES, ...ORG_READ_DOT_CODES]),
];
