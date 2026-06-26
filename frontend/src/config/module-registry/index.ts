import {
  Activity,
  Banknote,
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  CalendarDays,
  ClipboardCheck,
  Clock,
  Database,
  FileOutput,
  FileText,
  FolderKanban,
  GitBranch,
  Key,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageSquare,
  ScrollText,
  Search,
  Settings,
  Shield,
  Upload,
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
const ENTERPRISE_AND_MANAGER: PortalType[] = [PORTAL.ENTERPRISE, PORTAL.MANAGER];
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

  const setupItem: ModuleNavItem = {
    id: 'org-setup',
    label: 'Setup Wizard',
    path: ROUTES.ORGANIZATION_SETUP,
    icon: GitBranch,
    permission: 'company.update',
    portals: ENTERPRISE_ONLY,
  };

  const chartItem: ModuleNavItem = {
    id: 'org-chart',
    label: 'Org Chart',
    path: ROUTES.ORGANIZATION_CHART,
    icon: Building2,
    permission: 'company.read',
    portals: ENTERPRISE_ONLY,
  };

  const entityItems: ModuleNavItem[] = ENTITY_CATALOG.map((entity) => ({
    id: `org-${entity.key}`,
    label: entity.pluralLabel,
    path: orgEntityPath(entity.key),
    icon: Building2,
    permission: entityReadPermission(entity.key),
    portals: ENTERPRISE_ONLY,
  }));

  return [companyItem, setupItem, chartItem, ...entityItems];
}

const NAV_GROUPS: ModuleNavGroup[] = [
  {
    id: 'enterprise',
    label: 'Enterprise',
    portals: [PORTAL.ENTERPRISE],
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
    id: 'manager',
    label: 'Manager',
    portals: [PORTAL.MANAGER],
    items: [
      {
        id: 'manager-dashboard',
        label: 'Dashboard',
        path: ROUTES.MANAGER,
        icon: LayoutDashboard,
        permissionsAny: ['employee.read', 'project.dashboard.read', 'approval.read'],
        portals: [PORTAL.MANAGER],
      },
      {
        id: 'manager-attendance',
        label: 'Team Attendance',
        path: ROUTES.ATTENDANCE_TEAM,
        icon: Clock,
        permission: 'attendance.read',
        portals: [PORTAL.MANAGER],
        featureFlag: 'attendance',
      },
      {
        id: 'manager-payroll-finance',
        label: 'Payroll Finance',
        path: ROUTES.PAYROLL_FINANCE,
        icon: Banknote,
        permission: 'payroll.process',
        portals: [PORTAL.MANAGER],
        featureFlag: 'payroll',
      },
      {
        id: 'manager-sales',
        label: 'Sales Team',
        path: ROUTES.SALES_MANAGER,
        icon: BarChart3,
        permission: 'lead.read',
        portals: [PORTAL.MANAGER],
        featureFlag: 'sales',
      },
      {
        id: 'manager-communication',
        label: 'Communication',
        path: ROUTES.COMMUNICATION_MANAGER,
        icon: MessageSquare,
        permissionsAny: ['conversation.read', 'conversation.create'],
        portals: [PORTAL.MANAGER],
        featureFlag: 'communication',
        children: [
          {
            id: 'communication-manager',
            label: 'Manager',
            path: ROUTES.COMMUNICATION_MANAGER,
            icon: MessageSquare,
            permission: 'conversation.read',
            portals: [PORTAL.MANAGER],
            featureFlag: 'communication',
          },
          {
            id: 'communication-inbox',
            label: 'Inbox',
            path: ROUTES.COMMUNICATION_INBOX,
            icon: Mail,
            permission: 'notification.read',
            portals: [PORTAL.MANAGER],
            featureFlag: 'communication',
          },
        ],
      },
    ],
  },
  {
    id: 'workspace',
    label: 'My Work',
    portals: [PORTAL.WORKSPACE],
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
        id: 'workspace-calendar',
        label: 'Calendar',
        path: ROUTES.WORKSPACE_CALENDAR,
        icon: CalendarDays,
        permission: 'workspace.calendar.read',
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
        id: 'workspace-projects',
        label: 'My Projects',
        path: ROUTES.WORKSPACE_PROJECTS,
        icon: FolderKanban,
        permission: 'workspace.read',
        portals: WORKSPACE_ONLY,
      },
      {
        id: 'workspace-attendance',
        label: 'My Attendance',
        path: ROUTES.WORKSPACE_ATTENDANCE,
        icon: Clock,
        permission: 'attendance.read',
        portals: WORKSPACE_ONLY,
        featureFlag: 'attendance',
      },
      {
        id: 'workspace-payroll',
        label: 'My Payroll',
        path: ROUTES.WORKSPACE_PAYROLL,
        icon: Banknote,
        permission: 'payroll.read',
        portals: WORKSPACE_ONLY,
        featureFlag: 'payroll',
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
    ],
  },
  {
    id: 'organization',
    label: 'Organization',
    portals: ENTERPRISE_ONLY,
    items: buildOrganizationNavItems(),
  },
  {
    id: 'people',
    label: 'People',
    portals: ENTERPRISE_AND_MANAGER,
    items: [
      {
        id: 'employees',
        label: 'Employees',
        path: ROUTES.EMPLOYEES,
        icon: Users,
        permission: 'employee.read',
        portals: ENTERPRISE_AND_MANAGER,
      },
      {
        id: 'recruitment',
        label: 'Recruitment',
        path: ROUTES.RECRUITMENT,
        icon: Briefcase,
        permission: 'candidate.read',
        portals: ENTERPRISE_AND_MANAGER,
        featureFlag: 'recruitment',
      },
      {
        id: 'leave-exit',
        label: 'Leave & Exit',
        path: ROUTES.LEAVE_EXIT,
        icon: CalendarDays,
        permissionsAny: ['leave.read', 'resignation.read'],
        portals: ENTERPRISE_AND_MANAGER,
        featureFlag: 'leave_exit',
      },
      {
        id: 'attendance',
        label: 'Attendance',
        path: ROUTES.ATTENDANCE,
        icon: Clock,
        permission: 'attendance.read',
        portals: ENTERPRISE_AND_MANAGER,
        featureFlag: 'attendance',
        children: [
          {
            id: 'attendance-admin',
            label: 'Administration',
            path: ROUTES.ATTENDANCE_ADMIN,
            icon: Settings,
            permissionsAny: ['attendance.update', 'settings.manage'],
            portals: ENTERPRISE_ONLY,
            featureFlag: 'attendance',
          },
          {
            id: 'attendance-hr',
            label: 'HR Overview',
            path: ROUTES.ATTENDANCE_HR,
            icon: Users,
            permission: 'attendance.approve',
            portals: ENTERPRISE_ONLY,
            featureFlag: 'attendance',
          },
          {
            id: 'attendance-team',
            label: 'Team Attendance',
            path: ROUTES.ATTENDANCE_TEAM,
            icon: Clock,
            permission: 'attendance.read',
            portals: ENTERPRISE_AND_MANAGER,
            featureFlag: 'attendance',
          },
          {
            id: 'attendance-reports',
            label: 'Reports',
            path: ROUTES.ATTENDANCE_REPORTS,
            icon: FileText,
            permission: 'attendance.read',
            portals: ENTERPRISE_ONLY,
            featureFlag: 'attendance',
          },
        ],
      },
      {
        id: 'payroll',
        label: 'Payroll',
        path: ROUTES.PAYROLL,
        icon: Banknote,
        permission: 'payroll.read',
        portals: ENTERPRISE_ONLY,
        featureFlag: 'payroll',
        children: [
          {
            id: 'payroll-admin',
            label: 'Administration',
            path: ROUTES.PAYROLL_ADMIN,
            icon: Settings,
            permissionsAny: ['payroll.update', 'settings.manage'],
            portals: ENTERPRISE_ONLY,
            featureFlag: 'payroll',
          },
          {
            id: 'payroll-finance',
            label: 'Finance',
            path: ROUTES.PAYROLL_FINANCE,
            icon: Banknote,
            permission: 'payroll.process',
            portals: ENTERPRISE_ONLY,
            featureFlag: 'payroll',
          },
          {
            id: 'payroll-hr',
            label: 'HR Compensation',
            path: ROUTES.PAYROLL_HR,
            icon: Users,
            permission: 'payroll.read',
            portals: ENTERPRISE_ONLY,
            featureFlag: 'payroll',
          },
          {
            id: 'payroll-reports',
            label: 'Reports',
            path: ROUTES.PAYROLL_REPORTS,
            icon: FileText,
            permission: 'payroll.read',
            portals: ENTERPRISE_ONLY,
            featureFlag: 'payroll',
          },
        ],
      },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    portals: ENTERPRISE_AND_MANAGER,
    items: [
      {
        id: 'projects',
        label: 'Projects',
        path: ROUTES.PROJECTS,
        icon: FolderKanban,
        permission: 'project.read',
        portals: ENTERPRISE_AND_MANAGER,
        featureFlag: 'projects',
      },
      {
        id: 'sales',
        label: 'Sales CRM',
        path: ROUTES.SALES,
        icon: BarChart3,
        permission: 'lead.read',
        portals: ENTERPRISE_AND_MANAGER,
        featureFlag: 'sales',
        children: [
          {
            id: 'sales-admin',
            label: 'Administration',
            path: ROUTES.SALES_ADMIN,
            icon: Settings,
            permissionsAny: ['pipeline.update', 'settings.manage'],
            portals: ENTERPRISE_ONLY,
            featureFlag: 'sales',
          },
          {
            id: 'sales-manager',
            label: 'Manager',
            path: ROUTES.SALES_MANAGER,
            icon: Users,
            permission: 'lead.read',
            portals: ENTERPRISE_AND_MANAGER,
            featureFlag: 'sales',
          },
          {
            id: 'sales-executive',
            label: 'My Leads',
            path: ROUTES.SALES_EXECUTIVE,
            icon: BarChart3,
            permission: 'lead.read',
            portals: ENTERPRISE_AND_MANAGER,
            featureFlag: 'sales',
          },
          {
            id: 'sales-reports',
            label: 'Reports',
            path: ROUTES.SALES_REPORTS,
            icon: FileText,
            permission: 'lead.read',
            portals: ENTERPRISE_ONLY,
            featureFlag: 'sales',
          },
        ],
      },
      {
        id: 'communication',
        label: 'Communication Center',
        path: ROUTES.COMMUNICATION,
        icon: MessageSquare,
        permissionsAny: ['notification.read', 'notifications.broadcast'],
        portals: ENTERPRISE_ONLY,
        featureFlag: 'communication',
        children: [
          {
            id: 'communication-admin',
            label: 'Admin',
            path: ROUTES.COMMUNICATION_ADMIN,
            icon: Settings,
            permissionsAny: ['notifications.broadcast', 'settings.manage'],
            portals: ENTERPRISE_ONLY,
            featureFlag: 'communication',
          },
          {
            id: 'communication-reports',
            label: 'Reports',
            path: ROUTES.COMMUNICATION_REPORTS,
            icon: FileText,
            permissionsAny: ['notifications.broadcast', 'notification.read'],
            portals: ENTERPRISE_ONLY,
            featureFlag: 'communication',
          },
          {
            id: 'communication-search',
            label: 'Search',
            path: ROUTES.COMMUNICATION_SEARCH,
            icon: Search,
            permission: 'conversation.read',
            portals: ENTERPRISE_ONLY,
            featureFlag: 'communication',
          },
        ],
      },
      {
        id: 'approvals',
        label: 'Approvals',
        path: ROUTES.APPROVAL_INBOX,
        icon: ClipboardCheck,
        permission: 'approval.read',
        portals: ENTERPRISE_AND_MANAGER,
        children: [
          {
            id: 'approval-inbox',
            label: 'Inbox',
            path: ROUTES.APPROVAL_INBOX,
            icon: ClipboardCheck,
            permission: 'approval.read',
            portals: ENTERPRISE_AND_MANAGER,
          },
          {
            id: 'approval-history',
            label: 'History',
            path: ROUTES.APPROVAL_HISTORY,
            icon: FileText,
            permission: 'approval.read',
            portals: ENTERPRISE_AND_MANAGER,
          },
          {
            id: 'approval-workflows',
            label: 'Workflows',
            path: ROUTES.APPROVAL_WORKFLOWS,
            icon: Workflow,
            permission: 'workflow.read',
            portals: ENTERPRISE_ONLY,
          },
        ],
      },
    ],
  },
  {
    id: 'insights',
    label: 'Insights',
    portals: ENTERPRISE_ONLY,
    items: [
      {
        id: 'insights',
        label: 'Reports & BI',
        path: ROUTES.REPORTS_EXECUTIVE,
        icon: BarChart3,
        permissionsAny: ['analytics.dashboard.read', 'analytics.report.read'],
        portals: ENTERPRISE_ONLY,
        featureFlag: 'reports',
        children: [
          {
            id: 'reports-executive',
            label: 'Executive Dashboard',
            path: ROUTES.REPORTS_EXECUTIVE,
            icon: LayoutDashboard,
            permission: 'analytics.dashboard.read',
            portals: ENTERPRISE_ONLY,
            featureFlag: 'reports',
          },
          {
            id: 'analytics-hub',
            label: 'Analytics Hub',
            path: ROUTES.ANALYTICS,
            icon: BarChart3,
            permission: 'analytics.report.read',
            portals: ENTERPRISE_ONLY,
            featureFlag: 'analytics',
          },
          {
            id: 'reports-catalog',
            label: 'Report Catalog',
            path: ROUTES.REPORTS,
            icon: FileText,
            permission: 'analytics.report.read',
            portals: ENTERPRISE_ONLY,
            featureFlag: 'reports',
          },
        ],
      },
    ],
  },
  {
    id: 'administration',
    label: 'Administration',
    portals: ENTERPRISE_ONLY,
    items: [
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
        id: 'rbac-templates',
        label: 'Role Templates',
        path: ROUTES.RBAC_TEMPLATES,
        icon: Shield,
        permission: 'rbac.template.read',
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
      {
        id: 'notifications-admin',
        label: 'Notifications',
        path: '/admin/notifications',
        icon: Bell,
        permission: 'notification.manage',
        portals: ENTERPRISE_ONLY,
        featureFlag: 'notifications_admin',
      },
      {
        id: 'activity-feed',
        label: 'Activity Feed',
        path: '/admin/activity',
        icon: Activity,
        permission: 'timeline.read',
        portals: ENTERPRISE_ONLY,
        featureFlag: 'activity_feed',
      },
      {
        id: 'audit-explorer',
        label: 'Audit Explorer',
        path: ROUTES.AUDIT_EXPLORER,
        icon: FileText,
        permission: 'system.audit.read',
        portals: ENTERPRISE_ONLY,
        featureFlag: 'audit_logs',
      },
    ],
  },
  {
    id: 'system',
    label: 'System',
    portals: ENTERPRISE_ONLY,
    items: [
      {
        id: 'configuration-hub',
        label: 'Configuration Hub',
        path: ROUTES.CONFIGURATION,
        icon: Settings,
        permission: 'settings.manage',
        portals: ENTERPRISE_ONLY,
      },
      {
        id: 'feature-flags',
        label: 'Feature Flags',
        path: ROUTES.configurationSection('feature_flags'),
        icon: Settings,
        permission: 'settings.manage',
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
            id: 'integrations-dashboard',
            label: 'Dashboard',
            path: ROUTES.INTEGRATIONS,
            icon: LayoutDashboard,
            permission: 'system.config.read',
            portals: ENTERPRISE_ONLY,
            featureFlag: 'integrations',
          },
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
      {
        id: 'security',
        label: 'Security',
        path: '/system/security',
        icon: Shield,
        permission: 'system.config.manage',
        portals: ENTERPRISE_ONLY,
        featureFlag: 'security',
      },
      {
        id: 'navigation-manager',
        label: 'Navigation Manager',
        path: ROUTES.NAVIGATION_MANAGER,
        icon: GitBranch,
        permission: 'settings.manage',
        portals: ENTERPRISE_ONLY,
      },
      {
        id: 'system-health',
        label: 'System Health',
        path: ROUTES.SYSTEM_HEALTH,
        icon: Activity,
        permission: 'system.config.read',
        portals: ENTERPRISE_ONLY,
        featureFlag: 'system_health',
      },
    ],
  },
  {
    id: 'account',
    label: 'Account',
    portals: ALL_PORTALS,
    items: [
      {
        id: 'sessions',
        label: 'Sessions',
        path: ROUTES.SESSIONS,
        icon: LogOut,
        permission: 'auth.login',
        portals: ALL_PORTALS,
      },
    ],
  },
];

const ROUTE_REGISTRY: ModuleRouteMeta[] = [
  { path: ROUTES.ENTERPRISE, portals: ENTERPRISE_ONLY, permission: 'company.read' },
  { path: ROUTES.MANAGER, portals: [PORTAL.MANAGER], permissionsAny: ['employee.read', 'project.dashboard.read', 'approval.read'] },
  { path: ROUTES.WORKSPACE, portals: WORKSPACE_ONLY, permission: 'workspace.read' },
  { path: ROUTES.WORKSPACE_PROFILE, portals: WORKSPACE_ONLY, permission: 'workspace.read' },
  { path: ROUTES.WORKSPACE_PROJECTS, portals: WORKSPACE_ONLY, permission: 'workspace.read' },
  { path: ROUTES.WORKSPACE_TASKS, portals: WORKSPACE_ONLY, permission: 'workspace.read' },
  { path: ROUTES.WORKSPACE_DOCUMENTS, portals: WORKSPACE_ONLY, permission: 'workspace.read' },
  { path: ROUTES.WORKSPACE_NOTIFICATIONS, portals: WORKSPACE_ONLY, permission: 'workspace.read' },
  { path: ROUTES.WORKSPACE_ANNOUNCEMENTS, portals: WORKSPACE_ONLY, permission: 'workspace.read' },
  { path: ROUTES.WORKSPACE_CALENDAR, portals: WORKSPACE_ONLY, permission: 'workspace.calendar.read' },
  { path: ROUTES.WORKSPACE_ACTIVITY, portals: WORKSPACE_ONLY, permission: 'workspace.read' },
  { path: ROUTES.WORKSPACE_SEARCH, portals: WORKSPACE_ONLY, permission: 'workspace.read' },
  { path: ROUTES.WORKSPACE_MESSAGES, portals: WORKSPACE_ONLY, permissionsAny: ['chat.message.send', 'conversation.read'] },
  { path: ROUTES.ORGANIZATION, portals: ENTERPRISE_ONLY, permission: 'company.read' },
  { path: ROUTES.ORGANIZATION_SETUP, portals: ENTERPRISE_ONLY, permission: 'company.update' },
  { path: ROUTES.ORGANIZATION_CHART, portals: ENTERPRISE_ONLY, permission: 'company.read' },
  { path: ROUTES.ADMIN_SETTINGS, portals: ENTERPRISE_ONLY, permission: 'settings.read' },
  { path: ROUTES.CONFIGURATION, portals: ENTERPRISE_ONLY, permission: 'settings.manage' },
  { path: `${ROUTES.CONFIGURATION}/:section`, portals: ENTERPRISE_ONLY, permissionsAny: ['settings.read', 'settings.manage'] },
  { path: ROUTES.NAVIGATION_MANAGER, portals: ENTERPRISE_ONLY, permission: 'settings.manage' },
  { path: ROUTES.AUDIT_EXPLORER, portals: ENTERPRISE_ONLY, permission: 'system.audit.read' },
  { path: ROUTES.FEATURE_FLAGS, portals: ENTERPRISE_ONLY, permission: 'settings.manage' },
  { path: ROUTES.SYSTEM_DASHBOARD, portals: ENTERPRISE_ONLY, permission: 'system.config.read' },
  { path: ROUTES.SYSTEM_HEALTH, portals: ENTERPRISE_ONLY, permission: 'system.config.read' },
  { path: ROUTES.ADMIN_TEMPLATES, portals: ENTERPRISE_ONLY, permission: 'settings.read' },
  { path: ROUTES.RBAC_TEMPLATES, portals: ENTERPRISE_ONLY, permission: 'rbac.template.read' },
  { path: ROUTES.RBAC, portals: ENTERPRISE_ONLY, permission: 'rbac.role.read' },
  { path: ROUTES.RBAC_ROLES, portals: ENTERPRISE_ONLY, permission: 'rbac.role.read' },
  { path: ROUTES.RBAC_MATRIX, portals: ENTERPRISE_ONLY, permission: 'rbac.matrix.read' },
  { path: ROUTES.RBAC_SIMULATOR, portals: ENTERPRISE_ONLY, permission: 'rbac.simulator.run' },
  { path: ROUTES.EMPLOYEES, portals: ENTERPRISE_AND_MANAGER, permission: 'employee.read' },
  { path: ROUTES.EMPLOYEE_CREATE, portals: ENTERPRISE_AND_MANAGER, permission: 'employee.create' },
  { path: ROUTES.RECRUITMENT, portals: ENTERPRISE_AND_MANAGER, permission: 'candidate.read' },
  { path: ROUTES.RECRUITMENT_CANDIDATES, portals: ENTERPRISE_AND_MANAGER, permission: 'candidate.read' },
  { path: ROUTES.RECRUITMENT_CANDIDATE_CREATE, portals: ENTERPRISE_AND_MANAGER, permission: 'candidate.create' },
  { path: ROUTES.RECRUITMENT_PIPELINE, portals: ENTERPRISE_AND_MANAGER, permission: 'candidate.read' },
  { path: ROUTES.RECRUITMENT_INTERVIEWS, portals: ENTERPRISE_AND_MANAGER, permission: 'candidate.read' },
  { path: ROUTES.PROJECTS, portals: ENTERPRISE_AND_MANAGER, permission: 'project.read' },
  { path: ROUTES.PROJECTS_LIST, portals: ENTERPRISE_AND_MANAGER, permission: 'project.read' },
  { path: ROUTES.LEAVE_EXIT, portals: ENTERPRISE_AND_MANAGER, permissionsAny: ['leave.read', 'resignation.read'] },
  { path: ROUTES.LEAVE_APPLY, portals: ENTERPRISE_AND_MANAGER, permission: 'leave.create' },
  { path: ROUTES.LEAVE_REQUESTS, portals: ENTERPRISE_AND_MANAGER, permission: 'leave.read' },
  { path: ROUTES.LEAVE_CALENDAR, portals: ENTERPRISE_AND_MANAGER, permission: 'leave.read' },
  { path: ROUTES.LEAVE_BALANCES, portals: ENTERPRISE_AND_MANAGER, permission: 'leave.read' },
  { path: ROUTES.LEAVE_POLICIES, portals: ENTERPRISE_AND_MANAGER, permission: 'leave.read' },
  { path: ROUTES.RESIGNATION, portals: ENTERPRISE_AND_MANAGER, permission: 'resignation.read' },
  { path: ROUTES.EXIT, portals: ENTERPRISE_AND_MANAGER, permission: 'exit.read' },
  { path: ROUTES.APPROVAL_INBOX, portals: ENTERPRISE_AND_MANAGER, permission: 'approval.read' },
  { path: ROUTES.APPROVAL_HISTORY, portals: ENTERPRISE_AND_MANAGER, permission: 'approval.read' },
  { path: ROUTES.APPROVAL_WORKFLOWS, portals: ENTERPRISE_ONLY, permission: 'workflow.read' },
  { path: ROUTES.SESSIONS, portals: ALL_PORTALS, permission: 'auth.login' },
  { path: ROUTES.ATTENDANCE, portals: ALL_PORTALS, permission: 'attendance.read' },
  { path: ROUTES.ATTENDANCE_ADMIN, portals: ENTERPRISE_ONLY, permissionsAny: ['attendance.update', 'settings.manage'] },
  { path: ROUTES.ATTENDANCE_HR, portals: ENTERPRISE_ONLY, permission: 'attendance.approve' },
  { path: ROUTES.ATTENDANCE_TEAM, portals: ENTERPRISE_AND_MANAGER, permission: 'attendance.read' },
  { path: ROUTES.WORKSPACE_ATTENDANCE, portals: WORKSPACE_ONLY, permission: 'attendance.read' },
  { path: ROUTES.ATTENDANCE_REPORTS, portals: ENTERPRISE_ONLY, permission: 'attendance.read' },
  { path: ROUTES.PAYROLL, portals: ALL_PORTALS, permission: 'payroll.read' },
  { path: ROUTES.PAYROLL_ADMIN, portals: ENTERPRISE_ONLY, permissionsAny: ['payroll.update', 'settings.manage'] },
  { path: ROUTES.PAYROLL_FINANCE, portals: [...ENTERPRISE_ONLY, PORTAL.MANAGER], permission: 'payroll.process' },
  { path: ROUTES.PAYROLL_HR, portals: ENTERPRISE_ONLY, permission: 'payroll.read' },
  { path: ROUTES.WORKSPACE_PAYROLL, portals: WORKSPACE_ONLY, permission: 'payroll.read' },
  { path: ROUTES.PAYROLL_REPORTS, portals: ENTERPRISE_ONLY, permission: 'payroll.read' },
  { path: ROUTES.SALES, portals: ENTERPRISE_AND_MANAGER, permission: 'lead.read' },
  { path: ROUTES.SALES_ADMIN, portals: ENTERPRISE_ONLY, permissionsAny: ['pipeline.update', 'settings.manage'] },
  { path: ROUTES.SALES_MANAGER, portals: ENTERPRISE_AND_MANAGER, permission: 'lead.read' },
  { path: ROUTES.SALES_EXECUTIVE, portals: ENTERPRISE_AND_MANAGER, permission: 'lead.read' },
  { path: ROUTES.SALES_REPORTS, portals: ENTERPRISE_ONLY, permission: 'lead.read' },
  { path: ROUTES.COMMUNICATION, portals: ALL_PORTALS, permissionsAny: ['notification.read', 'notifications.broadcast', 'conversation.read'] },
  { path: ROUTES.COMMUNICATION_ADMIN, portals: ENTERPRISE_ONLY, permissionsAny: ['notifications.broadcast', 'settings.manage'] },
  { path: ROUTES.COMMUNICATION_MANAGER, portals: ENTERPRISE_AND_MANAGER, permission: 'conversation.read' },
  { path: ROUTES.COMMUNICATION_INBOX, portals: ENTERPRISE_AND_MANAGER, permission: 'notification.read' },
  { path: ROUTES.COMMUNICATION_REPORTS, portals: ENTERPRISE_ONLY, permissionsAny: ['notifications.broadcast', 'notification.read'] },
  { path: ROUTES.COMMUNICATION_SEARCH, portals: ALL_PORTALS, permission: 'conversation.read' },
  { path: ROUTES.REPORTS, portals: ENTERPRISE_ONLY, permission: 'analytics.report.read' },
  { path: ROUTES.REPORTS_EXECUTIVE, portals: ENTERPRISE_ONLY, permission: 'analytics.dashboard.read' },
  { path: ROUTES.REPORTS_DASHBOARD, portals: ENTERPRISE_ONLY, permission: 'analytics.dashboard.read' },
  { path: ROUTES.REPORTS_RUN, portals: ENTERPRISE_ONLY, permission: 'analytics.report.read' },
  { path: ROUTES.ANALYTICS, portals: ENTERPRISE_ONLY, permission: 'analytics.report.read' },
  { path: ROUTES.INTEGRATIONS, portals: ENTERPRISE_ONLY, permission: 'system.config.read' },
  { path: ROUTES.INTEGRATION_CONNECTORS, portals: ENTERPRISE_ONLY, permission: 'system.config.read' },
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

function isFeatureEnabled(featureFlag: string | undefined, flags: FeatureFlags): boolean {
  if (!featureFlag) {
    return true;
  }
  return flags[featureFlag] ?? false;
}

function canAccessItem(
  item: ModuleNavItem,
  ctx: NavigationFilterContext,
): boolean {
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
      const children = item.children ? applyOverridesToItems(item.children, overrideMap) : undefined;
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

function matchesRoutePattern(pathname: string, pattern: string): boolean {
  const normalized = normalizePath(pathname);
  if (pattern.includes(':')) {
    const prefix = pattern.split(':')[0]?.replace(/\/$/, '') ?? pattern;
    return normalized === prefix || normalized.startsWith(`${prefix}/`);
  }
  return normalized === pattern || normalized.startsWith(`${pattern}/`);
}

export function findRouteMeta(pathname: string): ModuleRouteMeta | undefined {
  const normalized = normalizePath(pathname);

  const exact = ROUTE_REGISTRY.find((route) => normalized === route.path || normalized.startsWith(`${route.path}/`));
  if (exact) {
    return exact;
  }

  if (normalized.startsWith(`${ROUTES.EMPLOYEES}/`) && normalized !== ROUTES.EMPLOYEE_CREATE) {
    return ROUTE_REGISTRY.find((route) => route.path === ROUTES.EMPLOYEES);
  }
  if (normalized.startsWith(`${ROUTES.RECRUITMENT_CANDIDATES}/`) && normalized !== ROUTES.RECRUITMENT_CANDIDATE_CREATE) {
    return ROUTE_REGISTRY.find((route) => route.path === ROUTES.RECRUITMENT_CANDIDATES);
  }
  if (normalized.startsWith(`${ROUTES.PROJECTS}/`) && normalized !== ROUTES.PROJECTS_LIST) {
    return ROUTE_REGISTRY.find((route) => route.path === ROUTES.PROJECTS);
  }
  if (normalized.startsWith(`${ROUTES.ATTENDANCE}/`) || normalized === ROUTES.ATTENDANCE) {
    return ROUTE_REGISTRY.find((route) => matchesRoutePattern(normalized, route.path)) ?? ROUTE_REGISTRY.find((route) => route.path === ROUTES.ATTENDANCE);
  }
  if (normalized.startsWith(`${ROUTES.PAYROLL}/`) || normalized === ROUTES.PAYROLL) {
    return ROUTE_REGISTRY.find((route) => matchesRoutePattern(normalized, route.path)) ?? ROUTE_REGISTRY.find((route) => route.path === ROUTES.PAYROLL);
  }
  if (normalized.startsWith(`${ROUTES.SALES}/`) || normalized === ROUTES.SALES) {
    return ROUTE_REGISTRY.find((route) => matchesRoutePattern(normalized, route.path)) ?? ROUTE_REGISTRY.find((route) => route.path === ROUTES.SALES);
  }
  if (normalized.startsWith(`${ROUTES.COMMUNICATION}/`) || normalized === ROUTES.COMMUNICATION) {
    return ROUTE_REGISTRY.find((route) => matchesRoutePattern(normalized, route.path)) ?? ROUTE_REGISTRY.find((route) => route.path === ROUTES.COMMUNICATION);
  }
  if (normalized.startsWith(`${ROUTES.REPORTS}/`) || normalized === ROUTES.REPORTS) {
    return ROUTE_REGISTRY.find((route) => matchesRoutePattern(normalized, route.path)) ?? ROUTE_REGISTRY.find((route) => route.path === ROUTES.REPORTS);
  }
  if (normalized.startsWith(`${ROUTES.ANALYTICS}/`) || normalized === ROUTES.ANALYTICS) {
    return ROUTE_REGISTRY.find((route) => route.path === ROUTES.ANALYTICS);
  }
  if (normalized.startsWith(`${ROUTES.ORGANIZATION}/`)) {
    const entityRoute = ROUTE_REGISTRY.find((route) => matchesRoutePattern(normalized, route.path));
    if (entityRoute) {
      return entityRoute;
    }
    return ROUTE_REGISTRY.find((route) => route.path === ROUTES.ORGANIZATION);
  }

  return undefined;
}

export function isPathAllowedForPortal(
  pathname: string,
  portal: PortalType,
  hasPermission: (code: string) => boolean,
  hasAnyPermission: (codes: string[]) => boolean,
): boolean {
  const meta = findRouteMeta(pathname);
  if (!meta) {
    return true;
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
    { id: 'employee-stats', title: 'Organization Headcount', permission: 'employee.read', colSpan: 2 as const },
    { id: 'recruitment-overview', title: 'Recruitment Pipeline', permission: 'candidate.read', colSpan: 2 as const },
    { id: 'project-overview', title: 'Project Portfolio', permission: 'project.read', colSpan: 2 as const },
    { id: 'pending-approvals', title: 'Pending Approvals', permission: 'approval.read', colSpan: 1 as const },
    { id: 'attendance-today', title: 'Attendance Today', permission: 'attendance.read', featureFlag: 'attendance', colSpan: 2 as const },
    { id: 'projects-at-risk', title: 'Projects At Risk', permission: 'project.read', colSpan: 2 as const },
    { id: 'recent-activities', title: 'Recent Company Activity', permission: 'timeline.read', colSpan: 2 as const },
    { id: 'system-health', title: 'System Health', permission: 'system.config.read', featureFlag: 'system_health', colSpan: 2 as const },
  ];

  return widgets.filter((widget) => {
    if (widget.featureFlag && !isFeatureEnabled(widget.featureFlag, ctx.featureFlags ?? DEFAULT_FEATURE_FLAGS)) {
      return false;
    }
    if (widget.permission) {
      return ctx.hasPermission(widget.permission);
    }
    return true;
  });
}
