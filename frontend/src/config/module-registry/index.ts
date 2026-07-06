import {
  BarChart3,
  Briefcase,
  Building2,
  CalendarDays,
  ClipboardCheck,
  Clock,
  Database,
  FileOutput,
  FolderKanban,
  GitBranch,
  Key,
  LayoutDashboard,
  MessageSquare,
  ScrollText,
  Settings,
  Shield,
  Upload,
  User,
  Users,
  Webhook,
  Workflow,
} from 'lucide-react';
import { ROUTES } from '@/config/app.config';
import { PORTAL, type PortalType } from '@/config/portals';
import { ENTITY_CATALOG } from '@/features/organization/constants/entity-catalog';
import { ENTITY_PERMISSIONS } from '@/features/admin/constants/entity-permissions';
import type { MasterEntityKey } from '@/features/organization/constants/entity-catalog';
import type {
  FeatureFlags,
  ModuleDefinition,
  ModuleNavGroup,
  ModuleNavItem,
  ModuleRouteMeta,
  NavigationFilterContext,
} from '@/config/module-registry/types';

export type { FeatureFlags };

const ENTERPRISE_ONLY: PortalType[] = [PORTAL.ENTERPRISE];
const MANAGER_ONLY: PortalType[] = [PORTAL.MANAGER];
const WORKSPACE_ONLY: PortalType[] = [PORTAL.WORKSPACE];
const ALL_PORTALS: PortalType[] = [PORTAL.ENTERPRISE, PORTAL.MANAGER, PORTAL.WORKSPACE];

function orgEntityPath(key: string): string {
  return ROUTES.organizationEntity(key);
}

function entityReadPermission(entityKey: string): string {
  const permissions = ENTITY_PERMISSIONS[entityKey as MasterEntityKey];
  return permissions?.read ?? 'company.read';
}

function buildOrganizationNavItems(): ModuleNavItem[] {
  const companyItem: ModuleNavItem = {
    id: 'org-company',
    label: 'Company',
    path: ROUTES.ORGANIZATION,
    icon: Building2,
    permission: 'company.read',
    portals: ENTERPRISE_ONLY,
  };

  const chartItem: ModuleNavItem = {
    id: 'org-chart',
    label: 'Org Chart',
    path: ROUTES.ORGANIZATION_CHART,
    icon: Building2,
    permission: 'employee.read',
    portals: ENTERPRISE_ONLY,
  };

  const entityItems: ModuleNavItem[] = ENTITY_CATALOG.filter((entity) => !entity.navHidden).map(
    (entity) => ({
      id: `org-${entity.key}`,
      label: entity.pluralLabel,
      path: orgEntityPath(entity.key),
      icon: Building2,
      permission: entityReadPermission(entity.key),
      portals: ENTERPRISE_ONLY,
    }),
  );

  return [companyItem, chartItem, ...entityItems];
}

const NAV_GROUPS: ModuleNavGroup[] = [
  {
    id: 'overview',
    label: 'Overview',
    portals: ENTERPRISE_ONLY,
    items: [
      {
        id: 'enterprise-dashboard',
        label: 'Dashboard',
        path: ROUTES.ENTERPRISE,
        icon: LayoutDashboard,
        permission: 'company.read',
        portals: ENTERPRISE_ONLY,
      },
    ],
  },
  {
    id: 'administration',
    label: 'Administration',
    portals: ENTERPRISE_ONLY,
    items: [
      {
        id: 'admin-organization',
        label: 'Organization Setup',
        path: ROUTES.ORGANIZATION,
        icon: Building2,
        permission: 'company.read',
        portals: ENTERPRISE_ONLY,
        children: buildOrganizationNavItems(),
      },
      {
        id: 'rbac-roles',
        label: 'Roles',
        path: ROUTES.RBAC_ROLES,
        icon: Shield,
        permission: 'rbac.role.read',
        portals: ENTERPRISE_ONLY,
      },
      {
        id: 'rbac-matrix',
        label: 'Permissions',
        path: ROUTES.RBAC_MATRIX,
        icon: Shield,
        permission: 'rbac.matrix.read',
        portals: ENTERPRISE_ONLY,
      },
      {
        id: 'enterprise-approvals-inbox',
        label: 'Approval Inbox',
        path: ROUTES.APPROVAL_INBOX,
        icon: ClipboardCheck,
        permission: 'approval.read',
        portals: ENTERPRISE_ONLY,
      },
      {
        id: 'approval-workflows-admin',
        label: 'Approval Workflows',
        path: ROUTES.APPROVAL_WORKFLOWS,
        icon: Workflow,
        permission: 'workflow.read',
        portals: ENTERPRISE_ONLY,
      },
    ],
  },
  {
    id: 'manager',
    label: 'HR',
    portals: MANAGER_ONLY,
    items: [
      {
        id: 'manager-dashboard',
        label: 'Dashboard',
        path: ROUTES.MANAGER,
        icon: LayoutDashboard,
        permissionsAny: [
          'employee.create',
          'employee.read',
          'project.dashboard.read',
          'approval.read',
          'candidate.read',
        ],
        portals: MANAGER_ONLY,
      },
    ],
  },
  {
    id: 'workspace',
    label: 'My Work',
    portals: WORKSPACE_ONLY,
    items: [
      {
        id: 'workspace-dashboard',
        label: 'Dashboard',
        path: ROUTES.WORKSPACE,
        icon: LayoutDashboard,
        permission: 'workspace.read',
        portals: WORKSPACE_ONLY,
      },
      {
        id: 'workspace-profile',
        label: 'My Profile',
        path: ROUTES.WORKSPACE_PROFILE,
        icon: User,
        permission: 'workspace.read',
        portals: WORKSPACE_ONLY,
      },
      {
        id: 'workspace-projects',
        label: 'My Projects',
        path: ROUTES.WORKSPACE_PROJECTS,
        icon: FolderKanban,
        permission: 'workspace.read',
        portals: WORKSPACE_ONLY,
      },
      {
        id: 'workspace-hierarchy',
        label: 'My Position',
        path: ROUTES.WORKSPACE_HIERARCHY,
        icon: GitBranch,
        permission: 'workspace.read',
        portals: WORKSPACE_ONLY,
      },
      {
        id: 'workspace-tasks',
        label: 'My Tasks',
        path: ROUTES.WORKSPACE_TASKS,
        icon: ClipboardCheck,
        permission: 'workspace.read',
        portals: WORKSPACE_ONLY,
      },
      {
        id: 'workspace-leave',
        label: 'Leave & Time Off',
        path: ROUTES.WORKSPACE_LEAVE_APPLY,
        icon: CalendarDays,
        permissionsAny: ['leave.read', 'leave.create', 'resignation.read'],
        portals: WORKSPACE_ONLY,
        featureFlag: 'leave_exit',
      },
      {
        id: 'workspace-messages',
        label: 'Messages',
        path: ROUTES.WORKSPACE_MESSAGES,
        icon: MessageSquare,
        permissionsAny: ['chat.message.send', 'conversation.read'],
        portals: WORKSPACE_ONLY,
        featureFlag: 'communication',
      },
      {
        id: 'workspace-calendar',
        label: 'My Calendar',
        path: ROUTES.WORKSPACE_CALENDAR,
        icon: CalendarDays,
        permission: 'workspace.calendar.read',
        portals: WORKSPACE_ONLY,
      },
      {
        id: 'workspace-attendance',
        label: 'Check In / Out',
        path: ROUTES.WORKSPACE_ATTENDANCE,
        icon: Clock,
        permission: 'attendance.read',
        portals: WORKSPACE_ONLY,
        featureFlag: 'attendance',
      },
      {
        id: 'workspace-sales-leads',
        label: 'My Leads',
        path: ROUTES.SALES_EXECUTIVE,
        icon: BarChart3,
        permission: 'lead.read',
        portals: WORKSPACE_ONLY,
        featureFlag: 'sales',
      },
    ],
  },
  {
    id: 'enterprise-people',
    label: 'People & HR',
    portals: ENTERPRISE_ONLY,
    items: [
      {
        id: 'employees',
        label: 'Employees',
        path: ROUTES.EMPLOYEES,
        icon: Users,
        permission: 'employee.read',
        portals: ENTERPRISE_ONLY,
      },
      {
        id: 'recruitment',
        label: 'Recruitment',
        path: ROUTES.RECRUITMENT,
        icon: Briefcase,
        permission: 'candidate.read',
        portals: ENTERPRISE_ONLY,
        featureFlag: 'recruitment',
      },
      {
        id: 'leave-exit',
        label: 'Leave & Time Off',
        path: ROUTES.LEAVE_EXIT,
        icon: CalendarDays,
        permissionsAny: ['leave.read', 'resignation.read'],
        portals: ENTERPRISE_ONLY,
        featureFlag: 'leave_exit',
      },
      {
        id: 'attendance',
        label: 'Attendance',
        path: ROUTES.ATTENDANCE,
        icon: Clock,
        permission: 'attendance.read',
        portals: ENTERPRISE_ONLY,
        featureFlag: 'attendance',
      },
    ],
  },
  {
    id: 'manager-team',
    label: 'My Team',
    portals: MANAGER_ONLY,
    items: [
      {
        id: 'manager-employees',
        label: 'Team Directory',
        path: ROUTES.EMPLOYEES,
        icon: Users,
        permission: 'employee.read',
        portals: MANAGER_ONLY,
      },
      {
        id: 'manager-recruitment',
        label: 'Recruitment',
        path: ROUTES.RECRUITMENT,
        icon: Briefcase,
        permission: 'candidate.read',
        portals: MANAGER_ONLY,
        featureFlag: 'recruitment',
      },
      {
        id: 'manager-leave',
        label: 'Leave & Time Off',
        path: ROUTES.LEAVE_EXIT,
        icon: CalendarDays,
        permissionsAny: ['leave.read', 'leave.approve'],
        portals: MANAGER_ONLY,
        featureFlag: 'leave_exit',
      },
      {
        id: 'manager-attendance',
        label: 'Team Attendance',
        path: ROUTES.ATTENDANCE_TEAM,
        icon: Clock,
        permission: 'attendance.read',
        portals: MANAGER_ONLY,
        featureFlag: 'attendance',
      },
    ],
  },
  {
    id: 'enterprise-operations',
    label: 'Operations',
    portals: ENTERPRISE_ONLY,
    items: [
      {
        id: 'projects',
        label: 'Projects',
        path: ROUTES.PROJECTS,
        icon: FolderKanban,
        permission: 'project.read',
        portals: ENTERPRISE_ONLY,
        featureFlag: 'projects',
      },
      {
        id: 'sales',
        label: 'Sales',
        path: ROUTES.SALES,
        icon: BarChart3,
        permission: 'lead.read',
        portals: ENTERPRISE_ONLY,
        featureFlag: 'sales',
      },
      {
        id: 'communication',
        label: 'Communication',
        path: ROUTES.COMMUNICATION,
        icon: MessageSquare,
        permissionsAny: ['notification.read', 'notifications.broadcast'],
        portals: ENTERPRISE_ONLY,
        featureFlag: 'communication',
      },
    ],
  },
  {
    id: 'manager-operations',
    label: 'Operations',
    portals: MANAGER_ONLY,
    items: [
      {
        id: 'manager-projects',
        label: 'Projects',
        path: ROUTES.PROJECTS,
        icon: FolderKanban,
        permission: 'project.read',
        portals: MANAGER_ONLY,
        featureFlag: 'projects',
      },
      {
        id: 'manager-sales',
        label: 'Sales Team',
        path: ROUTES.SALES_MANAGER,
        icon: BarChart3,
        permission: 'lead.read',
        portals: MANAGER_ONLY,
        featureFlag: 'sales',
      },
      {
        id: 'manager-approvals',
        label: 'Approvals',
        path: ROUTES.APPROVAL_INBOX,
        icon: ClipboardCheck,
        permission: 'approval.read',
        portals: MANAGER_ONLY,
      },
      {
        id: 'manager-communication',
        label: 'Communication',
        path: ROUTES.COMMUNICATION_MANAGER,
        icon: MessageSquare,
        permission: 'conversation.read',
        portals: MANAGER_ONLY,
        featureFlag: 'communication',
      },
    ],
  },
  {
    id: 'system',
    label: 'System',
    portals: ENTERPRISE_ONLY,
    items: [
      {
        id: 'system-settings',
        label: 'Settings',
        path: ROUTES.ADMIN_SETTINGS,
        icon: Settings,
        permission: 'settings.read',
        portals: ENTERPRISE_ONLY,
      },
      {
        id: 'integrations',
        label: 'Integrations',
        path: ROUTES.INTEGRATIONS,
        icon: GitBranch,
        permission: 'system.config.read',
        portals: ENTERPRISE_ONLY,
        featureFlag: 'integrations',
        children: [
          {
            id: 'integrations-connectors',
            label: 'Connectors',
            path: ROUTES.INTEGRATION_CONNECTORS,
            icon: GitBranch,
            permission: 'system.config.read',
            portals: ENTERPRISE_ONLY,
            featureFlag: 'integrations',
          },
          {
            id: 'integrations-api-keys',
            label: 'API Keys',
            path: ROUTES.API_KEYS,
            icon: Key,
            permission: 'system.config.manage',
            portals: ENTERPRISE_ONLY,
            featureFlag: 'integrations',
          },
          {
            id: 'integrations-webhooks',
            label: 'Webhooks',
            path: ROUTES.WEBHOOKS,
            icon: Webhook,
            permission: 'system.config.manage',
            portals: ENTERPRISE_ONLY,
            featureFlag: 'integrations',
          },
          {
            id: 'integrations-import',
            label: 'Import',
            path: ROUTES.IMPORT_CENTER,
            icon: Upload,
            permission: 'system.config.manage',
            portals: ENTERPRISE_ONLY,
            featureFlag: 'integrations',
          },
          {
            id: 'integrations-export',
            label: 'Export',
            path: ROUTES.EXPORT_CENTER,
            icon: FileOutput,
            permission: 'system.config.manage',
            portals: ENTERPRISE_ONLY,
            featureFlag: 'integrations',
          },
          {
            id: 'integrations-scheduler',
            label: 'Scheduler',
            path: ROUTES.SCHEDULER,
            icon: Clock,
            permission: 'system.config.read',
            portals: ENTERPRISE_ONLY,
            featureFlag: 'integrations',
          },
          {
            id: 'integrations-logs',
            label: 'Logs',
            path: ROUTES.INTEGRATION_LOGS,
            icon: ScrollText,
            permission: 'system.config.read',
            portals: ENTERPRISE_ONLY,
            featureFlag: 'integrations',
          },
          {
            id: 'integrations-backups',
            label: 'Backups',
            path: ROUTES.BACKUPS,
            icon: Database,
            permission: 'system.config.manage',
            portals: ENTERPRISE_ONLY,
            featureFlag: 'integrations',
          },
        ],
      },
    ],
  },
];

const ROUTE_REGISTRY: ModuleRouteMeta[] = [
  { path: ROUTES.ENTERPRISE, portals: ENTERPRISE_ONLY, permission: 'company.read' },
  {
    path: ROUTES.MANAGER,
    portals: [PORTAL.MANAGER],
    permissionsAny: [
      'employee.create',
      'employee.read',
      'project.dashboard.read',
      'approval.read',
      'candidate.read',
    ],
  },
  { path: ROUTES.WORKSPACE, portals: WORKSPACE_ONLY, permission: 'workspace.read' },
  { path: ROUTES.WORKSPACE_PROFILE, portals: WORKSPACE_ONLY, permission: 'workspace.read' },
  { path: ROUTES.WORKSPACE_HIERARCHY, portals: WORKSPACE_ONLY, permission: 'workspace.read' },
  { path: ROUTES.WORKSPACE_PROJECTS, portals: WORKSPACE_ONLY, permission: 'workspace.read' },
  {
    path: `${ROUTES.WORKSPACE_PROJECTS}/:id`,
    portals: WORKSPACE_ONLY,
    permission: 'workspace.read',
  },
  { path: ROUTES.WORKSPACE_TASKS, portals: WORKSPACE_ONLY, permission: 'workspace.read' },
  { path: ROUTES.WORKSPACE_DOCUMENTS, portals: WORKSPACE_ONLY, permission: 'workspace.read' },
  { path: ROUTES.WORKSPACE_NOTIFICATIONS, portals: WORKSPACE_ONLY, permission: 'workspace.read' },
  { path: ROUTES.WORKSPACE_ANNOUNCEMENTS, portals: WORKSPACE_ONLY, permission: 'workspace.read' },
  {
    path: ROUTES.WORKSPACE_CALENDAR,
    portals: WORKSPACE_ONLY,
    permission: 'workspace.calendar.read',
  },
  { path: ROUTES.WORKSPACE_SEARCH, portals: WORKSPACE_ONLY, permission: 'workspace.read' },
  {
    path: ROUTES.WORKSPACE_MESSAGES,
    portals: WORKSPACE_ONLY,
    permissionsAny: ['chat.message.send', 'conversation.read'],
  },
  { path: ROUTES.ORGANIZATION, portals: ENTERPRISE_ONLY, permission: 'company.read' },
  {
    path: ROUTES.ORGANIZATION_CHART,
    portals: [...ENTERPRISE_ONLY, ...MANAGER_ONLY],
    permission: 'employee.read',
  },
  {
    path: ROUTES.SETTINGS,
    portals: ENTERPRISE_ONLY,
    permissionsAny: ['settings.read', 'company.update'],
  },
  {
    path: `${ROUTES.ORGANIZATION}/:entityKey/:id`,
    portals: ENTERPRISE_ONLY,
    permissionsAny: ['company.read', 'branch.read', 'department.read', 'designation.read'],
  },
  { path: ROUTES.ADMIN_SETTINGS, portals: ENTERPRISE_ONLY, permission: 'settings.read' },
  { path: ROUTES.ADMIN_TEMPLATES, portals: ENTERPRISE_ONLY, permission: 'settings.read' },
  { path: ROUTES.RBAC_TEMPLATES, portals: ENTERPRISE_ONLY, permission: 'rbac.role.read' },
  { path: ROUTES.RBAC, portals: ENTERPRISE_ONLY, permission: 'rbac.role.read' },
  { path: ROUTES.RBAC_ROLES, portals: ENTERPRISE_ONLY, permission: 'rbac.role.read' },
  { path: ROUTES.RBAC_MATRIX, portals: ENTERPRISE_ONLY, permission: 'rbac.matrix.read' },
  { path: ROUTES.RBAC_SIMULATOR, portals: ENTERPRISE_ONLY, permission: 'rbac.simulator.run' },
  {
    path: ROUTES.EMPLOYEES,
    portals: [...ENTERPRISE_ONLY, ...MANAGER_ONLY],
    permission: 'employee.read',
  },
  { path: ROUTES.EMPLOYEE_CREATE, portals: ENTERPRISE_ONLY, permission: 'employee.create' },
  {
    path: `${ROUTES.EMPLOYEES}/:id`,
    portals: [...ENTERPRISE_ONLY, ...MANAGER_ONLY],
    permission: 'employee.read',
  },
  {
    path: ROUTES.RECRUITMENT,
    portals: [...ENTERPRISE_ONLY, ...MANAGER_ONLY],
    permission: 'candidate.read',
  },
  {
    path: ROUTES.RECRUITMENT_CANDIDATES,
    portals: [...ENTERPRISE_ONLY, ...MANAGER_ONLY],
    permission: 'candidate.read',
  },
  {
    path: ROUTES.RECRUITMENT_CANDIDATE_CREATE,
    portals: [...ENTERPRISE_ONLY, ...MANAGER_ONLY],
    permission: 'candidate.create',
  },
  {
    path: `${ROUTES.RECRUITMENT_CANDIDATES}/:id`,
    portals: [...ENTERPRISE_ONLY, ...MANAGER_ONLY],
    permission: 'candidate.read',
  },
  {
    path: ROUTES.RECRUITMENT_PIPELINE,
    portals: [...ENTERPRISE_ONLY, ...MANAGER_ONLY],
    permission: 'candidate.read',
  },
  {
    path: ROUTES.RECRUITMENT_INTERVIEWS,
    portals: [...ENTERPRISE_ONLY, ...MANAGER_ONLY],
    permission: 'candidate.read',
  },
  {
    path: ROUTES.PROJECTS,
    portals: [...ENTERPRISE_ONLY, ...MANAGER_ONLY],
    permission: 'project.read',
  },
  {
    path: ROUTES.PROJECTS_LIST,
    portals: [...ENTERPRISE_ONLY, ...MANAGER_ONLY],
    permission: 'project.read',
  },
  { path: ROUTES.PROJECTS_CREATE, portals: ENTERPRISE_ONLY, permission: 'project.create' },
  {
    path: `${ROUTES.PROJECTS}/:id`,
    portals: [...ENTERPRISE_ONLY, ...MANAGER_ONLY],
    permission: 'project.read',
  },
  {
    path: ROUTES.LEAVE_EXIT,
    portals: [...ENTERPRISE_ONLY, ...MANAGER_ONLY],
    permissionsAny: ['leave.read', 'resignation.read'],
  },
  {
    path: ROUTES.LEAVE_REQUESTS,
    portals: [...ENTERPRISE_ONLY, ...MANAGER_ONLY],
    permission: 'leave.read',
  },
  {
    path: ROUTES.LEAVE_CALENDAR,
    portals: [...ENTERPRISE_ONLY, ...MANAGER_ONLY],
    permission: 'leave.calendar.read',
  },
  { path: ROUTES.LEAVE_BALANCES, portals: ENTERPRISE_ONLY, permission: 'leave.balance.read' },
  {
    path: ROUTES.LEAVE_SETUP,
    portals: ENTERPRISE_ONLY,
    permissionsAny: ['leave-type.read', 'leave.policy.read'],
  },
  { path: ROUTES.LEAVE_POLICIES, portals: ENTERPRISE_ONLY, permission: 'leave.policy.read' },
  {
    path: ROUTES.LEAVE_OFFBOARDING,
    portals: ENTERPRISE_ONLY,
    permissionsAny: ['resignation.read', 'exit.read'],
  },
  { path: ROUTES.RESIGNATION, portals: ENTERPRISE_ONLY, permission: 'resignation.read' },
  { path: ROUTES.EXIT, portals: ENTERPRISE_ONLY, permission: 'exit.read' },
  { path: ROUTES.WORKSPACE_LEAVE_APPLY, portals: WORKSPACE_ONLY, permission: 'leave.create' },
  { path: ROUTES.WORKSPACE_LEAVE_REQUESTS, portals: WORKSPACE_ONLY, permission: 'leave.read' },
  {
    path: ROUTES.WORKSPACE_LEAVE_BALANCE,
    portals: WORKSPACE_ONLY,
    permission: 'leave.balance.read',
  },
  { path: ROUTES.WORKSPACE_RESIGNATION, portals: WORKSPACE_ONLY, permission: 'resignation.read' },
  {
    path: ROUTES.APPROVAL_INBOX,
    portals: [...ENTERPRISE_ONLY, ...MANAGER_ONLY],
    permission: 'approval.read',
  },
  {
    path: ROUTES.APPROVAL_HISTORY,
    portals: [...ENTERPRISE_ONLY, ...MANAGER_ONLY],
    permission: 'approval.read',
  },
  { path: ROUTES.APPROVAL_WORKFLOWS, portals: ENTERPRISE_ONLY, permission: 'workflow.read' },
  {
    path: ROUTES.ATTENDANCE,
    portals: [...ENTERPRISE_ONLY, ...MANAGER_ONLY],
    permission: 'attendance.read',
  },
  { path: ROUTES.ATTENDANCE_ADMIN, portals: ENTERPRISE_ONLY, permission: 'attendance.update' },
  { path: ROUTES.ATTENDANCE_HR, portals: ENTERPRISE_ONLY, permission: 'attendance.approve' },
  { path: ROUTES.ATTENDANCE_TEAM, portals: MANAGER_ONLY, permission: 'attendance.read' },
  { path: ROUTES.WORKSPACE_ATTENDANCE, portals: WORKSPACE_ONLY, permission: 'attendance.read' },
  {
    path: ROUTES.ATTENDANCE_REPORTS,
    portals: ENTERPRISE_ONLY,
    permission: 'analytics.report.read',
  },
  { path: ROUTES.PAYROLL_REPORTS, portals: ENTERPRISE_ONLY, permission: 'analytics.report.read' },
  { path: ROUTES.SALES_REPORTS, portals: ENTERPRISE_ONLY, permission: 'analytics.report.read' },
  {
    path: ROUTES.COMMUNICATION_REPORTS,
    portals: ENTERPRISE_ONLY,
    permission: 'analytics.report.read',
  },
  {
    path: ROUTES.PAYROLL,
    portals: [...ENTERPRISE_ONLY, ...MANAGER_ONLY],
    permissionsAny: ['payroll.read', 'payroll.update', 'payroll.process'],
  },
  {
    path: ROUTES.PAYROLL_ADMIN,
    portals: [...ENTERPRISE_ONLY, ...MANAGER_ONLY],
    permissionsAny: ['payroll.read', 'payroll.update', 'payroll.process'],
  },
  {
    path: ROUTES.PAYROLL_FINANCE,
    portals: [...ENTERPRISE_ONLY, ...MANAGER_ONLY],
    permissionsAny: ['payroll.read', 'payroll.update', 'payroll.process'],
  },
  {
    path: ROUTES.PAYROLL_HR,
    portals: [...ENTERPRISE_ONLY, ...MANAGER_ONLY],
    permissionsAny: ['payroll.read', 'payroll.update', 'payroll.process'],
  },
  {
    path: ROUTES.WORKSPACE_PAYROLL,
    portals: WORKSPACE_ONLY,
    permissionsAny: ['payslip.read', 'payroll.read'],
  },
  { path: ROUTES.SALES, portals: ENTERPRISE_ONLY, permission: 'lead.read' },
  { path: ROUTES.SALES_ADMIN, portals: ENTERPRISE_ONLY, permission: 'lead.read' },
  { path: ROUTES.SALES_MANAGER, portals: MANAGER_ONLY, permission: 'lead.read' },
  { path: ROUTES.SALES_EXECUTIVE, portals: WORKSPACE_ONLY, permission: 'lead.read' },
  {
    path: ROUTES.COMMUNICATION,
    portals: ENTERPRISE_ONLY,
    permissionsAny: ['notification.read', 'notifications.broadcast'],
  },
  {
    path: ROUTES.COMMUNICATION_ADMIN,
    portals: ENTERPRISE_ONLY,
    permission: 'notifications.broadcast',
  },
  { path: ROUTES.COMMUNICATION_MANAGER, portals: MANAGER_ONLY, permission: 'conversation.read' },
  { path: ROUTES.COMMUNICATION_INBOX, portals: MANAGER_ONLY, permission: 'notification.read' },
  {
    path: ROUTES.COMMUNICATION_SEARCH,
    portals: [...ENTERPRISE_ONLY, ...MANAGER_ONLY],
    permission: 'conversation.read',
  },
  {
    path: `${ROUTES.SALES}/leads/:id`,
    portals: [...MANAGER_ONLY, ...WORKSPACE_ONLY],
    permission: 'lead.read',
  },
  { path: ROUTES.INTEGRATIONS, portals: ENTERPRISE_ONLY, permission: 'system.config.read' },
  {
    path: ROUTES.INTEGRATION_CONNECTORS,
    portals: ENTERPRISE_ONLY,
    permission: 'system.config.read',
  },
  { path: ROUTES.API_KEYS, portals: ENTERPRISE_ONLY, permission: 'system.config.manage' },
  { path: ROUTES.WEBHOOKS, portals: ENTERPRISE_ONLY, permission: 'system.config.manage' },
  { path: ROUTES.IMPORT_CENTER, portals: ENTERPRISE_ONLY, permission: 'system.config.manage' },
  { path: ROUTES.EXPORT_CENTER, portals: ENTERPRISE_ONLY, permission: 'system.config.manage' },
  { path: ROUTES.SCHEDULER, portals: ENTERPRISE_ONLY, permission: 'system.config.read' },
  { path: ROUTES.INTEGRATION_LOGS, portals: ENTERPRISE_ONLY, permission: 'system.config.read' },
  { path: ROUTES.BACKUPS, portals: ENTERPRISE_ONLY, permission: 'system.config.manage' },
  { path: '/system/storage', portals: ENTERPRISE_ONLY, permission: 'system.config.read' },
  { path: '/system/email', portals: ENTERPRISE_ONLY, permission: 'system.config.read' },
];

ENTITY_CATALOG.forEach((entity) => {
  ROUTE_REGISTRY.push({
    path: orgEntityPath(entity.key),
    portals: ENTERPRISE_ONLY,
    permission: entityReadPermission(entity.key),
  });
});

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  recruitment: true,
  projects: true,
  chat: false,
  leave_exit: true,
  attendance: true,
  payroll: true,
  sales: true,
  communication: true,
  reports: true,
  analytics: true,
  notifications_admin: false,
  activity_feed: false,
  audit_logs: true,
  integrations: true,
  storage: false,
  email: false,
  security: false,
  system_health: true,
};

export const MODULE_REGISTRY: ModuleDefinition[] = [
  {
    id: 'core',
    name: 'Core',
    icon: LayoutDashboard,
    portals: ALL_PORTALS,
    navigation: NAV_GROUPS,
    routes: ROUTE_REGISTRY,
    dashboardWidgets: [],
  },
];

function isFeatureEnabled(_featureFlag: string | undefined, _flags: FeatureFlags): boolean {
  return true;
}

function canAccessItem(item: ModuleNavItem, ctx: NavigationFilterContext): boolean {
  if (!item.portals.includes(ctx.portal)) {
    return false;
  }
  if (!isFeatureEnabled(item.featureFlag, ctx.featureFlags ?? DEFAULT_FEATURE_FLAGS)) {
    return false;
  }
  if (item.permission) {
    return ctx.hasPermission(item.permission);
  }
  if (item.permissionsAny) {
    return ctx.hasAnyPermission(item.permissionsAny);
  }
  return true;
}

function filterNavItems(items: ModuleNavItem[], ctx: NavigationFilterContext): ModuleNavItem[] {
  return items
    .filter((item) => canAccessItem(item, ctx))
    .map((item) => ({
      ...item,
      children: item.children ? filterNavItems(item.children, ctx) : undefined,
    }));
}

export interface NavigationItemOverride {
  id: string;
  enabled?: boolean;
  order?: number;
  label?: string;
  path?: string;
}

function applyOverridesToItems(
  items: ModuleNavItem[],
  overrideMap: Map<string, NavigationItemOverride>,
): ModuleNavItem[] {
  return items
    .filter((item) => {
      const override = overrideMap.get(item.id);
      return override?.enabled !== false;
    })
    .map((item) => {
      const override = overrideMap.get(item.id);
      const children = item.children
        ? applyOverridesToItems(item.children, overrideMap)
        : undefined;
      if (!override) {
        return { ...item, children };
      }
      return {
        ...item,
        label: override.label ?? item.label,
        path: override.path ?? item.path,
        children,
      };
    })
    .sort((a, b) => {
      const orderA = overrideMap.get(a.id)?.order ?? 9999;
      const orderB = overrideMap.get(b.id)?.order ?? 9999;
      if (orderA !== orderB) return orderA - orderB;
      return a.label.localeCompare(b.label);
    });
}

export function applyNavigationOverrides(
  groups: ModuleNavGroup[],
  overrides: NavigationItemOverride[],
): ModuleNavGroup[] {
  const overrideMap = new Map(overrides.map((item) => [item.id, item]));
  return groups
    .map((group) => ({
      ...group,
      items: applyOverridesToItems(group.items, overrideMap),
    }))
    .filter((group) => group.items.length > 0);
}

export function buildNavigationForPortal(ctx: NavigationFilterContext): ModuleNavGroup[] {
  const flags = ctx.featureFlags ?? DEFAULT_FEATURE_FLAGS;

  return NAV_GROUPS.filter((group) => group.portals.includes(ctx.portal))
    .map((group) => ({
      ...group,
      items: filterNavItems(group.items, { ...ctx, featureFlags: flags }),
    }))
    .filter((group) => group.items.length > 0);
}

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function routeSpecificityScore(path: string): number {
  const parts = path.split('/').filter(Boolean);
  let score = parts.length * 100;
  for (const part of parts) {
    if (!part.startsWith(':')) {
      score += 10;
    }
  }
  return score;
}

function matchesRoutePattern(pathname: string, pattern: string): boolean {
  const normalized = normalizePath(pathname);

  if (!pattern.includes(':')) {
    return normalized === pattern || normalized.startsWith(`${pattern}/`);
  }

  const pathParts = normalized.split('/').filter(Boolean);
  const patternParts = pattern.split('/').filter(Boolean);
  if (pathParts.length !== patternParts.length) {
    return false;
  }

  return patternParts.every((part, index) => {
    if (part.startsWith(':')) {
      return (pathParts[index]?.length ?? 0) > 0;
    }
    return part === pathParts[index];
  });
}

export function findRouteMeta(pathname: string): ModuleRouteMeta | undefined {
  const normalized = normalizePath(pathname);

  const candidates = ROUTE_REGISTRY.filter((route) => matchesRoutePattern(normalized, route.path));
  if (candidates.length === 0) {
    return undefined;
  }

  candidates.sort((a, b) => routeSpecificityScore(b.path) - routeSpecificityScore(a.path));
  return candidates[0];
}

export function isPathAllowedForPortal(
  pathname: string,
  portal: PortalType,
  hasPermission: (code: string) => boolean,
  hasAnyPermission: (codes: string[]) => boolean,
): boolean {
  const meta = findRouteMeta(pathname);
  if (!meta) {
    return false;
  }
  if (!meta.portals.includes(portal)) {
    return false;
  }
  if (meta.permission) {
    return hasPermission(meta.permission);
  }
  if (meta.permissionsAny) {
    return hasAnyPermission(meta.permissionsAny);
  }
  return true;
}

export function getEnterpriseDashboardWidgets(ctx: NavigationFilterContext) {
  const widgets = [
    {
      id: 'employee-stats',
      title: 'Organization Headcount',
      permission: 'company.read',
      colSpan: 2 as const,
    },
    {
      id: 'pending-approvals',
      title: 'Pending Approvals',
      permission: 'approval.read',
      colSpan: 2 as const,
    },
    {
      id: 'attendance-today',
      title: 'Company Attendance Today',
      permission: 'attendance.read',
      featureFlag: 'attendance',
      colSpan: 2 as const,
    },
    {
      id: 'employees-on-leave',
      title: 'Employees On Leave',
      permission: 'leave.read',
      featureFlag: 'leave_exit',
      colSpan: 2 as const,
    },
    {
      id: 'recruitment-overview',
      title: 'Recruitment Pipeline',
      permission: 'candidate.read',
      featureFlag: 'recruitment',
      colSpan: 2 as const,
    },
  ];

  return widgets.filter((widget) => {
    if (
      widget.featureFlag &&
      !isFeatureEnabled(widget.featureFlag, ctx.featureFlags ?? DEFAULT_FEATURE_FLAGS)
    ) {
      return false;
    }
    if (widget.permission) {
      return ctx.hasPermission(widget.permission);
    }
    return true;
  });
}

export function getManagerDashboardWidgets(ctx: NavigationFilterContext) {
  const widgets = [
    { id: 'employee-stats', title: 'Team Size', permission: 'employee.read', colSpan: 2 as const },
    {
      id: 'pending-approvals',
      title: 'Pending Approvals',
      permission: 'approval.read',
      colSpan: 2 as const,
    },
    {
      id: 'employees-on-leave',
      title: 'Team On Leave',
      permission: 'leave.read',
      featureFlag: 'leave_exit',
      colSpan: 2 as const,
    },
    {
      id: 'attendance-today',
      title: 'Team Attendance Today',
      permission: 'attendance.read',
      featureFlag: 'attendance',
      colSpan: 2 as const,
    },
    {
      id: 'pending-interviews',
      title: 'Upcoming Interviews',
      permission: 'candidate.read',
      featureFlag: 'recruitment',
      colSpan: 2 as const,
    },
  ];

  return widgets.filter((widget) => {
    if (
      widget.featureFlag &&
      !isFeatureEnabled(widget.featureFlag, ctx.featureFlags ?? DEFAULT_FEATURE_FLAGS)
    ) {
      return false;
    }
    if (widget.permission) {
      return ctx.hasPermission(widget.permission);
    }
    return true;
  });
}
