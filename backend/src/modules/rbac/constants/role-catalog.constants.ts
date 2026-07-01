import { SYSTEM_ROLE_SLUG } from '@modules/rbac/constants/rbac.constants.js';
import { PERMISSION_MODULE } from '@modules/rbac/constants/enterprise-permission-catalog.constants.js';

export interface DefaultRoleDefinition {
  slug: string;
  name: string;
  description: string;
  priority: number;
  isSystem: boolean;
  permissionFilter?: (code: string, module: string) => boolean;
  permissionCodes?: string[];
}


export const DEFAULT_ROLE_CATALOG: DefaultRoleDefinition[] = [
  {
    slug: SYSTEM_ROLE_SLUG.SUPER_ADMIN,
    name: 'Super Admin',
    description: 'Full system access — all permissions, protected from modification',
    priority: 0,
    isSystem: true,
    permissionFilter: () => true,
  },
  {
    slug: SYSTEM_ROLE_SLUG.DIRECTOR,
    name: 'Director',
    description: 'Executive access with broad read and operational permissions',
    priority: 10,
    isSystem: true,
    permissionFilter: (_code, module) => module !== 'system' || _code === 'system.audit.read',
  },
  {
    slug: SYSTEM_ROLE_SLUG.HR,
    name: 'HR',
    description: 'Human resources management access',
    priority: 20,
    isSystem: true,
    permissionFilter: (code, module) =>
      (
        module === PERMISSION_MODULE.EMPLOYEE
        || module === PERMISSION_MODULE.RECRUITMENT
        || module === PERMISSION_MODULE.ORGANIZATION
        || module === PERMISSION_MODULE.RBAC
        || module === PERMISSION_MODULE.SETTINGS
        || module === PERMISSION_MODULE.ATTENDANCE
        || module === PERMISSION_MODULE.APPROVAL
        || module === PERMISSION_MODULE.LEAVE
      ) && !code.endsWith('.delete'),
  },
  {
    slug: SYSTEM_ROLE_SLUG.PROJECT_MANAGER,
    name: 'Project Manager',
    description: 'Project and task management access',
    priority: 30,
    isSystem: true,
    permissionFilter: (code, module) =>
      (
        module === PERMISSION_MODULE.PROJECTS
        || module === PERMISSION_MODULE.TASKS
        || module === PERMISSION_MODULE.EMPLOYEE
      ) && (code.endsWith('.read') || code.endsWith('.create') || code.endsWith('.update')),
  },
  {
    slug: SYSTEM_ROLE_SLUG.SALES_MANAGER,
    name: 'Sales Manager',
    description: 'Sales pipeline and lead management',
    priority: 30,
    isSystem: true,
    permissionFilter: (code, module) =>
      module === PERMISSION_MODULE.SALES
      && (code.endsWith('.read') || code.endsWith('.create') || code.endsWith('.update')),
  },
  {
    slug: SYSTEM_ROLE_SLUG.FINANCE,
    name: 'Finance',
    description: 'Payroll and financial operations',
    priority: 30,
    isSystem: true,
    permissionFilter: (code, module) =>
      [PERMISSION_MODULE.PAYROLL, PERMISSION_MODULE.ANALYTICS].includes(module as typeof PERMISSION_MODULE.PAYROLL)
      && !code.endsWith('.delete'),
  },
  {
    slug: SYSTEM_ROLE_SLUG.EMPLOYEE,
    name: 'Employee',
    description: 'Standard employee self-service access',
    priority: 50,
    isSystem: true,
    permissionCodes: [
      'auth.login',
      'auth.logout',
      'workspace.read',
      'workspace.widgets.read',
      'workspace.calendar.read',
      'workspace.search',
      'announcement.read',
      'announcement.acknowledge',
      'profile.read',
      'profile.update',
      'document.read',
      'timeline.read',
      'notification.read',
      'notification.manage',
      'employee.read',
      'task.read',
      'project.read',
      'attendance.read',
      'leave.read',
      'leave.create',
      'leave.update',
      'leave.balance.read',
      'leave.calendar.read',
      'resignation.read',
      'resignation.create',
      'resignation.update',
      'approval.read',
      'approval.execute',
      'conversation.read',
      'conversation.create',
      'chat.message.send',
      'settings.read',
    ],
  },
  {
    slug: SYSTEM_ROLE_SLUG.INTERN,
    name: 'Intern',
    description: 'Limited intern access',
    priority: 60,
    isSystem: true,
    permissionCodes: ['auth.login', 'auth.logout', 'attendance.read', 'notification.read', 'chat.message.send'],
  },
];

export const DEFAULT_ROLE_GROUPS = [
  { slug: 'executive', name: 'Executive', sortOrder: 10 },
  { slug: 'management', name: 'Management', sortOrder: 20 },
  { slug: 'operations', name: 'Operations', sortOrder: 30 },
  { slug: 'staff', name: 'Staff', sortOrder: 40 },
] as const;

export const DEFAULT_APPROVAL_HIERARCHY = [
  { level: 1, slug: 'manager', name: 'Manager', priority: 10, roleSlug: SYSTEM_ROLE_SLUG.PROJECT_MANAGER },
  { level: 2, slug: 'department_head', name: 'Department Head', priority: 20 },
  { level: 3, slug: 'hr', name: 'HR', priority: 30, roleSlug: SYSTEM_ROLE_SLUG.HR },
  { level: 4, slug: 'director', name: 'Director', priority: 40, roleSlug: SYSTEM_ROLE_SLUG.DIRECTOR },
  { level: 5, slug: 'super_admin', name: 'Super Admin', priority: 50, roleSlug: SYSTEM_ROLE_SLUG.SUPER_ADMIN },
] as const;
