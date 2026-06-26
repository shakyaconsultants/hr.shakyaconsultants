export interface EnterprisePermissionEntry {
  code: string;
  name: string;
  module: string;
  action: string;
  groupSlug: string;
  category: string;
  dependsOn?: string[];
  description?: string;
  isSystem?: boolean;
  sortOrder?: number;
}

export const PERMISSION_MODULE = {
  AUTH: 'auth',
  RBAC: 'rbac',
  COMPANY: 'company',
  ORGANIZATION: 'organization',
  SETTINGS: 'settings',
  EMPLOYEE: 'employee',
  RECRUITMENT: 'recruitment',
  PROJECTS: 'projects',
  WORKSPACE: 'workspace',
  APPROVAL: 'approval',
  LEAVE: 'leave',
  TASKS: 'tasks',
  ATTENDANCE: 'attendance',
  PAYROLL: 'payroll',
  SALES: 'sales',
  CHAT: 'chat',
  NOTIFICATIONS: 'notifications',
  ANALYTICS: 'analytics',
  SYSTEM: 'system',
} as const;

export const PERMISSION_GROUP = {
  AUTH: 'auth',
  RBAC: 'rbac',
  COMPANY: 'company',
  ORGANIZATION: 'organization',
  SETTINGS: 'settings',
  EMPLOYEE: 'employee',
  RECRUITMENT: 'recruitment',
  PROJECTS: 'projects',
  WORKSPACE: 'workspace',
  APPROVAL: 'approval',
  LEAVE: 'leave',
  TASKS: 'tasks',
  ATTENDANCE: 'attendance',
  PAYROLL: 'payroll',
  SALES: 'sales',
  CHAT: 'chat',
  NOTIFICATIONS: 'notifications',
  ANALYTICS: 'analytics',
  SYSTEM: 'system',
} as const;

function dotCrud(
  module: string,
  resource: string,
  groupSlug: string,
  category: string,
  label: string,
): EnterprisePermissionEntry[] {
  return [
    { code: `${resource}.read`, name: `Read ${label}`, module, action: 'read', groupSlug, category },
    { code: `${resource}.create`, name: `Create ${label}`, module, action: 'create', groupSlug, category, dependsOn: [`${resource}.read`] },
    { code: `${resource}.update`, name: `Update ${label}`, module, action: 'update', groupSlug, category, dependsOn: [`${resource}.read`] },
    { code: `${resource}.delete`, name: `Delete ${label}`, module, action: 'delete', groupSlug, category, dependsOn: [`${resource}.read`] },
  ];
}

/** Enterprise permission catalog — seeds all modules (future-ready) */
export const ENTERPRISE_PERMISSION_CATALOG: EnterprisePermissionEntry[] = [
  // Auth
  { code: 'auth.login', name: 'Login', module: PERMISSION_MODULE.AUTH, action: 'login', groupSlug: PERMISSION_GROUP.AUTH, category: 'authentication', isSystem: true },
  { code: 'auth.logout', name: 'Logout', module: PERMISSION_MODULE.AUTH, action: 'logout', groupSlug: PERMISSION_GROUP.AUTH, category: 'authentication', isSystem: true },
  { code: 'auth.session.manage', name: 'Manage Sessions', module: PERMISSION_MODULE.AUTH, action: 'manage', groupSlug: PERMISSION_GROUP.AUTH, category: 'authentication' },
  { code: 'auth.user.read', name: 'View Users', module: PERMISSION_MODULE.AUTH, action: 'read', groupSlug: PERMISSION_GROUP.AUTH, category: 'users' },
  { code: 'auth.user.manage', name: 'Manage Users', module: PERMISSION_MODULE.AUTH, action: 'manage', groupSlug: PERMISSION_GROUP.AUTH, category: 'users', dependsOn: ['auth.user.read'] },

  // RBAC
  { code: 'rbac.permission.read', name: 'Read Permissions', module: PERMISSION_MODULE.RBAC, action: 'read', groupSlug: PERMISSION_GROUP.RBAC, category: 'permissions' },
  { code: 'rbac.permission.manage', name: 'Manage Permissions', module: PERMISSION_MODULE.RBAC, action: 'manage', groupSlug: PERMISSION_GROUP.RBAC, category: 'permissions', dependsOn: ['rbac.permission.read'] },
  { code: 'rbac.role.read', name: 'Read Roles', module: PERMISSION_MODULE.RBAC, action: 'read', groupSlug: PERMISSION_GROUP.RBAC, category: 'roles' },
  { code: 'rbac.role.create', name: 'Create Roles', module: PERMISSION_MODULE.RBAC, action: 'create', groupSlug: PERMISSION_GROUP.RBAC, category: 'roles', dependsOn: ['rbac.role.read'] },
  { code: 'rbac.role.update', name: 'Update Roles', module: PERMISSION_MODULE.RBAC, action: 'update', groupSlug: PERMISSION_GROUP.RBAC, category: 'roles', dependsOn: ['rbac.role.read'] },
  { code: 'rbac.role.delete', name: 'Delete Roles', module: PERMISSION_MODULE.RBAC, action: 'delete', groupSlug: PERMISSION_GROUP.RBAC, category: 'roles', dependsOn: ['rbac.role.read'] },
  { code: 'rbac.role.clone', name: 'Clone Roles', module: PERMISSION_MODULE.RBAC, action: 'clone', groupSlug: PERMISSION_GROUP.RBAC, category: 'roles', dependsOn: ['rbac.role.read'] },
  { code: 'rbac.assignment.read', name: 'Read Role Assignments', module: PERMISSION_MODULE.RBAC, action: 'read', groupSlug: PERMISSION_GROUP.RBAC, category: 'assignments' },
  { code: 'rbac.assignment.manage', name: 'Manage Role Assignments', module: PERMISSION_MODULE.RBAC, action: 'manage', groupSlug: PERMISSION_GROUP.RBAC, category: 'assignments', dependsOn: ['rbac.assignment.read'] },
  { code: 'rbac.simulator.run', name: 'Run Permission Simulator', module: PERMISSION_MODULE.RBAC, action: 'run', groupSlug: PERMISSION_GROUP.RBAC, category: 'simulator', dependsOn: ['rbac.role.read'] },
  { code: 'rbac.hierarchy.read', name: 'Read Hierarchies', module: PERMISSION_MODULE.RBAC, action: 'read', groupSlug: PERMISSION_GROUP.RBAC, category: 'hierarchy' },
  { code: 'rbac.hierarchy.manage', name: 'Manage Hierarchies', module: PERMISSION_MODULE.RBAC, action: 'manage', groupSlug: PERMISSION_GROUP.RBAC, category: 'hierarchy', dependsOn: ['rbac.hierarchy.read'] },
  { code: 'rbac.matrix.read', name: 'View Permission Matrix', module: PERMISSION_MODULE.RBAC, action: 'read', groupSlug: PERMISSION_GROUP.RBAC, category: 'matrix', dependsOn: ['rbac.permission.read'] },

  // Company & Organization (from org module)
  { code: 'company.read', name: 'Read Company', module: PERMISSION_MODULE.COMPANY, action: 'read', groupSlug: PERMISSION_GROUP.COMPANY, category: 'company' },
  { code: 'company.update', name: 'Update Company', module: PERMISSION_MODULE.COMPANY, action: 'update', groupSlug: PERMISSION_GROUP.COMPANY, category: 'company', dependsOn: ['company.read'] },
  ...dotCrud(PERMISSION_MODULE.ORGANIZATION, 'branch', PERMISSION_GROUP.ORGANIZATION, 'branches', 'Branch'),
  ...dotCrud(PERMISSION_MODULE.ORGANIZATION, 'department', PERMISSION_GROUP.ORGANIZATION, 'departments', 'Department'),
  ...dotCrud(PERMISSION_MODULE.ORGANIZATION, 'designation', PERMISSION_GROUP.ORGANIZATION, 'designations', 'Designation'),
  ...dotCrud(PERMISSION_MODULE.ORGANIZATION, 'jobrole', PERMISSION_GROUP.ORGANIZATION, 'job_roles', 'Job Role'),
  ...dotCrud(PERMISSION_MODULE.ORGANIZATION, 'office-location', PERMISSION_GROUP.ORGANIZATION, 'locations', 'Office Location'),
  ...dotCrud(PERMISSION_MODULE.ORGANIZATION, 'work-shift', PERMISSION_GROUP.ORGANIZATION, 'shifts', 'Work Shift'),
  ...dotCrud(PERMISSION_MODULE.ORGANIZATION, 'holiday', PERMISSION_GROUP.ORGANIZATION, 'holidays', 'Holiday'),
  ...dotCrud(PERMISSION_MODULE.ORGANIZATION, 'employment-type', PERMISSION_GROUP.ORGANIZATION, 'lookups', 'Employment Type'),
  ...dotCrud(PERMISSION_MODULE.ORGANIZATION, 'salary-grade', PERMISSION_GROUP.ORGANIZATION, 'lookups', 'Salary Grade'),
  ...dotCrud(PERMISSION_MODULE.ORGANIZATION, 'leave-type', PERMISSION_GROUP.ORGANIZATION, 'lookups', 'Leave Type'),
  ...dotCrud(PERMISSION_MODULE.ORGANIZATION, 'project-category', PERMISSION_GROUP.ORGANIZATION, 'lookups', 'Project Category'),
  ...dotCrud(PERMISSION_MODULE.ORGANIZATION, 'technology', PERMISSION_GROUP.ORGANIZATION, 'lookups', 'Technology'),
  ...dotCrud(PERMISSION_MODULE.ORGANIZATION, 'skill', PERMISSION_GROUP.ORGANIZATION, 'lookups', 'Skill'),
  { code: 'organization.bulk', name: 'Bulk Organization Operations', module: PERMISSION_MODULE.ORGANIZATION, action: 'bulk', groupSlug: PERMISSION_GROUP.ORGANIZATION, category: 'bulk' },
  { code: 'organization.export', name: 'Export Organization Data', module: PERMISSION_MODULE.ORGANIZATION, action: 'export', groupSlug: PERMISSION_GROUP.ORGANIZATION, category: 'bulk' },
  { code: 'organization.import', name: 'Import Organization Data', module: PERMISSION_MODULE.ORGANIZATION, action: 'import', groupSlug: PERMISSION_GROUP.ORGANIZATION, category: 'bulk' },

  // Settings
  { code: 'settings.read', name: 'Read Settings', module: PERMISSION_MODULE.SETTINGS, action: 'read', groupSlug: PERMISSION_GROUP.SETTINGS, category: 'settings' },
  { code: 'settings.manage', name: 'Manage Settings', module: PERMISSION_MODULE.SETTINGS, action: 'manage', groupSlug: PERMISSION_GROUP.SETTINGS, category: 'settings', dependsOn: ['settings.read'] },

  // Employee
  ...dotCrud(PERMISSION_MODULE.EMPLOYEE, 'employee', PERMISSION_GROUP.EMPLOYEE, 'employees', 'Employee'),
  { code: 'employee.export', name: 'Export Employees', module: PERMISSION_MODULE.EMPLOYEE, action: 'export', groupSlug: PERMISSION_GROUP.EMPLOYEE, category: 'employees', dependsOn: ['employee.read'] },
  { code: 'employee.import', name: 'Import Employees', module: PERMISSION_MODULE.EMPLOYEE, action: 'import', groupSlug: PERMISSION_GROUP.EMPLOYEE, category: 'employees', dependsOn: ['employee.read'] },
  { code: 'employee.bulk', name: 'Bulk Employee Actions', module: PERMISSION_MODULE.EMPLOYEE, action: 'bulk', groupSlug: PERMISSION_GROUP.EMPLOYEE, category: 'employees', dependsOn: ['employee.read'] },
  { code: 'employee.documents.read', name: 'Read Employee Documents', module: PERMISSION_MODULE.EMPLOYEE, action: 'read', groupSlug: PERMISSION_GROUP.EMPLOYEE, category: 'documents', dependsOn: ['employee.read'] },
  { code: 'employee.documents.manage', name: 'Manage Employee Documents', module: PERMISSION_MODULE.EMPLOYEE, action: 'manage', groupSlug: PERMISSION_GROUP.EMPLOYEE, category: 'documents', dependsOn: ['employee.documents.read'] },
  { code: 'employee.bank.read', name: 'Read Bank Details', module: PERMISSION_MODULE.EMPLOYEE, action: 'read', groupSlug: PERMISSION_GROUP.EMPLOYEE, category: 'bank', dependsOn: ['employee.read'] },
  { code: 'employee.bank.manage', name: 'Manage Bank Details', module: PERMISSION_MODULE.EMPLOYEE, action: 'manage', groupSlug: PERMISSION_GROUP.EMPLOYEE, category: 'bank', dependsOn: ['employee.bank.read'] },
  { code: 'employee.education.read', name: 'Read Education', module: PERMISSION_MODULE.EMPLOYEE, action: 'read', groupSlug: PERMISSION_GROUP.EMPLOYEE, category: 'education', dependsOn: ['employee.read'] },
  { code: 'employee.education.manage', name: 'Manage Education', module: PERMISSION_MODULE.EMPLOYEE, action: 'manage', groupSlug: PERMISSION_GROUP.EMPLOYEE, category: 'education', dependsOn: ['employee.education.read'] },
  { code: 'employee.experience.read', name: 'Read Experience', module: PERMISSION_MODULE.EMPLOYEE, action: 'read', groupSlug: PERMISSION_GROUP.EMPLOYEE, category: 'experience', dependsOn: ['employee.read'] },
  { code: 'employee.experience.manage', name: 'Manage Experience', module: PERMISSION_MODULE.EMPLOYEE, action: 'manage', groupSlug: PERMISSION_GROUP.EMPLOYEE, category: 'experience', dependsOn: ['employee.experience.read'] },
  { code: 'employee.skills.read', name: 'Read Skills', module: PERMISSION_MODULE.EMPLOYEE, action: 'read', groupSlug: PERMISSION_GROUP.EMPLOYEE, category: 'skills', dependsOn: ['employee.read'] },
  { code: 'employee.skills.manage', name: 'Manage Skills', module: PERMISSION_MODULE.EMPLOYEE, action: 'manage', groupSlug: PERMISSION_GROUP.EMPLOYEE, category: 'skills', dependsOn: ['employee.skills.read'] },
  { code: 'employee.certifications.read', name: 'Read Certifications', module: PERMISSION_MODULE.EMPLOYEE, action: 'read', groupSlug: PERMISSION_GROUP.EMPLOYEE, category: 'certifications', dependsOn: ['employee.read'] },
  { code: 'employee.certifications.manage', name: 'Manage Certifications', module: PERMISSION_MODULE.EMPLOYEE, action: 'manage', groupSlug: PERMISSION_GROUP.EMPLOYEE, category: 'certifications', dependsOn: ['employee.certifications.read'] },
  { code: 'employee.assets.read', name: 'Read Assets', module: PERMISSION_MODULE.EMPLOYEE, action: 'read', groupSlug: PERMISSION_GROUP.EMPLOYEE, category: 'assets', dependsOn: ['employee.read'] },
  { code: 'employee.assets.manage', name: 'Manage Assets', module: PERMISSION_MODULE.EMPLOYEE, action: 'manage', groupSlug: PERMISSION_GROUP.EMPLOYEE, category: 'assets', dependsOn: ['employee.assets.read'] },
  { code: 'employee.timeline.read', name: 'Read Timeline', module: PERMISSION_MODULE.EMPLOYEE, action: 'read', groupSlug: PERMISSION_GROUP.EMPLOYEE, category: 'timeline', dependsOn: ['employee.read'] },
  { code: 'employee.managers.read', name: 'Read Manager Relationships', module: PERMISSION_MODULE.EMPLOYEE, action: 'read', groupSlug: PERMISSION_GROUP.EMPLOYEE, category: 'managers', dependsOn: ['employee.read'] },
  { code: 'employee.managers.manage', name: 'Manage Manager Relationships', module: PERMISSION_MODULE.EMPLOYEE, action: 'manage', groupSlug: PERMISSION_GROUP.EMPLOYEE, category: 'managers', dependsOn: ['employee.managers.read'] },

  // Recruitment
  ...dotCrud(PERMISSION_MODULE.RECRUITMENT, 'candidate', PERMISSION_GROUP.RECRUITMENT, 'candidates', 'Candidate'),
  { code: 'candidate.export', name: 'Export Candidates', module: PERMISSION_MODULE.RECRUITMENT, action: 'export', groupSlug: PERMISSION_GROUP.RECRUITMENT, category: 'candidates', dependsOn: ['candidate.read'] },
  { code: 'candidate.import', name: 'Import Candidates', module: PERMISSION_MODULE.RECRUITMENT, action: 'import', groupSlug: PERMISSION_GROUP.RECRUITMENT, category: 'candidates', dependsOn: ['candidate.read'] },
  { code: 'candidate.merge', name: 'Merge Candidates', module: PERMISSION_MODULE.RECRUITMENT, action: 'merge', groupSlug: PERMISSION_GROUP.RECRUITMENT, category: 'candidates', dependsOn: ['candidate.update'] },
  ...dotCrud(PERMISSION_MODULE.RECRUITMENT, 'interview', PERMISSION_GROUP.RECRUITMENT, 'interviews', 'Interview'),
  ...dotCrud(PERMISSION_MODULE.RECRUITMENT, 'offer', PERMISSION_GROUP.RECRUITMENT, 'offers', 'Offer Letter'),
  { code: 'onboarding.read', name: 'Read Onboarding', module: PERMISSION_MODULE.RECRUITMENT, action: 'read', groupSlug: PERMISSION_GROUP.RECRUITMENT, category: 'onboarding', dependsOn: ['candidate.read'] },
  { code: 'onboarding.manage', name: 'Manage Onboarding', module: PERMISSION_MODULE.RECRUITMENT, action: 'manage', groupSlug: PERMISSION_GROUP.RECRUITMENT, category: 'onboarding', dependsOn: ['onboarding.read'] },
  { code: 'conversion.execute', name: 'Convert Candidate to Employee', module: PERMISSION_MODULE.RECRUITMENT, action: 'execute', groupSlug: PERMISSION_GROUP.RECRUITMENT, category: 'conversion', dependsOn: ['candidate.read', 'employee.create'] },

  // Projects & Tasks
  ...dotCrud(PERMISSION_MODULE.PROJECTS, 'project', PERMISSION_GROUP.PROJECTS, 'projects', 'Project'),
  { code: 'project.dashboard.read', name: 'Read Project Dashboard', module: PERMISSION_MODULE.PROJECTS, action: 'read', groupSlug: PERMISSION_GROUP.PROJECTS, category: 'dashboard', dependsOn: ['project.read'] },
  { code: 'project.worklog.read', name: 'Read Work Logs', module: PERMISSION_MODULE.PROJECTS, action: 'read', groupSlug: PERMISSION_GROUP.PROJECTS, category: 'worklogs', dependsOn: ['project.read'] },
  { code: 'project.worklog.manage', name: 'Manage Work Logs', module: PERMISSION_MODULE.PROJECTS, action: 'manage', groupSlug: PERMISSION_GROUP.PROJECTS, category: 'worklogs', dependsOn: ['project.worklog.read'] },
  { code: 'project.knowledge.read', name: 'Read Knowledge Base', module: PERMISSION_MODULE.PROJECTS, action: 'read', groupSlug: PERMISSION_GROUP.PROJECTS, category: 'knowledge', dependsOn: ['project.read'] },
  { code: 'project.knowledge.manage', name: 'Manage Knowledge Base', module: PERMISSION_MODULE.PROJECTS, action: 'manage', groupSlug: PERMISSION_GROUP.PROJECTS, category: 'knowledge', dependsOn: ['project.knowledge.read'] },
  { code: 'project.archive', name: 'Archive Projects', module: PERMISSION_MODULE.PROJECTS, action: 'archive', groupSlug: PERMISSION_GROUP.PROJECTS, category: 'projects', dependsOn: ['project.update'] },
  { code: 'project.assign_manager', name: 'Assign Project Manager', module: PERMISSION_MODULE.PROJECTS, action: 'assign', groupSlug: PERMISSION_GROUP.PROJECTS, category: 'projects', dependsOn: ['project.update'] },
  { code: 'project.assign_members', name: 'Assign Project Members', module: PERMISSION_MODULE.PROJECTS, action: 'assign', groupSlug: PERMISSION_GROUP.PROJECTS, category: 'projects', dependsOn: ['project.read'] },
  { code: 'project.manage_repository', name: 'Manage Project Repository', module: PERMISSION_MODULE.PROJECTS, action: 'manage', groupSlug: PERMISSION_GROUP.PROJECTS, category: 'repository', dependsOn: ['project.knowledge.read'] },
  { code: 'project.manage_environment', name: 'Manage Project Environment', module: PERMISSION_MODULE.PROJECTS, action: 'manage', groupSlug: PERMISSION_GROUP.PROJECTS, category: 'environment', dependsOn: ['project.knowledge.manage'] },
  { code: 'project.manage_settings', name: 'Manage Project Settings', module: PERMISSION_MODULE.PROJECTS, action: 'manage', groupSlug: PERMISSION_GROUP.PROJECTS, category: 'settings', dependsOn: ['project.update'] },
  { code: 'project.manage_workflow', name: 'Manage Project Workflow', module: PERMISSION_MODULE.PROJECTS, action: 'manage', groupSlug: PERMISSION_GROUP.PROJECTS, category: 'workflow', dependsOn: ['project.update'] },
  { code: 'project.view_all', name: 'View All Projects', module: PERMISSION_MODULE.PROJECTS, action: 'read', groupSlug: PERMISSION_GROUP.PROJECTS, category: 'projects', dependsOn: ['project.read'] },
  { code: 'project.view_assigned', name: 'View Assigned Projects', module: PERMISSION_MODULE.PROJECTS, action: 'read', groupSlug: PERMISSION_GROUP.PROJECTS, category: 'projects', dependsOn: ['project.read'] },
  ...dotCrud(PERMISSION_MODULE.TASKS, 'task', PERMISSION_GROUP.TASKS, 'tasks', 'Task'),
  ...dotCrud(PERMISSION_MODULE.TASKS, 'sprint', PERMISSION_GROUP.TASKS, 'sprints', 'Sprint'),
  ...dotCrud(PERMISSION_MODULE.PROJECTS, 'milestone', PERMISSION_GROUP.PROJECTS, 'milestones', 'Milestone'),
  ...dotCrud(PERMISSION_MODULE.PROJECTS, 'module', PERMISSION_GROUP.PROJECTS, 'modules', 'Project Module'),
  { code: 'verification.read', name: 'Read Task Verifications', module: PERMISSION_MODULE.TASKS, action: 'read', groupSlug: PERMISSION_GROUP.TASKS, category: 'verification', dependsOn: ['task.read'] },
  { code: 'verification.execute', name: 'Execute Task Verification', module: PERMISSION_MODULE.TASKS, action: 'execute', groupSlug: PERMISSION_GROUP.TASKS, category: 'verification', dependsOn: ['verification.read'] },

  // Workspace (Employee Self-Service Portal)
  { code: 'workspace.read', name: 'Access Employee Workspace', module: PERMISSION_MODULE.WORKSPACE, action: 'read', groupSlug: PERMISSION_GROUP.WORKSPACE, category: 'workspace' },
  { code: 'workspace.widgets.read', name: 'Read Workspace Widgets', module: PERMISSION_MODULE.WORKSPACE, action: 'read', groupSlug: PERMISSION_GROUP.WORKSPACE, category: 'widgets', dependsOn: ['workspace.read'] },
  { code: 'workspace.widgets.manage', name: 'Manage Workspace Widget Layout', module: PERMISSION_MODULE.WORKSPACE, action: 'manage', groupSlug: PERMISSION_GROUP.WORKSPACE, category: 'widgets', dependsOn: ['workspace.widgets.read'] },
  { code: 'workspace.calendar.read', name: 'Read Personal Calendar', module: PERMISSION_MODULE.WORKSPACE, action: 'read', groupSlug: PERMISSION_GROUP.WORKSPACE, category: 'calendar', dependsOn: ['workspace.read'] },
  { code: 'workspace.search', name: 'Workspace Search', module: PERMISSION_MODULE.WORKSPACE, action: 'read', groupSlug: PERMISSION_GROUP.WORKSPACE, category: 'search', dependsOn: ['workspace.read'] },
  { code: 'announcement.read', name: 'Read Announcements', module: PERMISSION_MODULE.WORKSPACE, action: 'read', groupSlug: PERMISSION_GROUP.WORKSPACE, category: 'announcements', dependsOn: ['workspace.read'] },
  { code: 'announcement.acknowledge', name: 'Acknowledge Announcements', module: PERMISSION_MODULE.WORKSPACE, action: 'update', groupSlug: PERMISSION_GROUP.WORKSPACE, category: 'announcements', dependsOn: ['announcement.read'] },
  { code: 'profile.read', name: 'Read Own Profile', module: PERMISSION_MODULE.WORKSPACE, action: 'read', groupSlug: PERMISSION_GROUP.WORKSPACE, category: 'profile', dependsOn: ['workspace.read'] },
  { code: 'profile.update', name: 'Update Own Profile', module: PERMISSION_MODULE.WORKSPACE, action: 'update', groupSlug: PERMISSION_GROUP.WORKSPACE, category: 'profile', dependsOn: ['profile.read'] },
  { code: 'document.read', name: 'Read Own Documents', module: PERMISSION_MODULE.WORKSPACE, action: 'read', groupSlug: PERMISSION_GROUP.WORKSPACE, category: 'documents', dependsOn: ['workspace.read'] },
  { code: 'timeline.read', name: 'Read Activity Timeline', module: PERMISSION_MODULE.WORKSPACE, action: 'read', groupSlug: PERMISSION_GROUP.WORKSPACE, category: 'timeline', dependsOn: ['workspace.read'] },
  { code: 'notification.manage', name: 'Manage Own Notifications', module: PERMISSION_MODULE.NOTIFICATIONS, action: 'manage', groupSlug: PERMISSION_GROUP.NOTIFICATIONS, category: 'notifications', dependsOn: ['notification.read'] },

  // Universal Approval Engine
  { code: 'approval.read', name: 'Read Approvals', module: PERMISSION_MODULE.APPROVAL, action: 'read', groupSlug: PERMISSION_GROUP.APPROVAL, category: 'approvals' },
  { code: 'approval.create', name: 'Create Approval Requests', module: PERMISSION_MODULE.APPROVAL, action: 'create', groupSlug: PERMISSION_GROUP.APPROVAL, category: 'approvals', dependsOn: ['approval.read'] },
  { code: 'approval.execute', name: 'Execute Approvals', module: PERMISSION_MODULE.APPROVAL, action: 'execute', groupSlug: PERMISSION_GROUP.APPROVAL, category: 'approvals', dependsOn: ['approval.read'] },
  { code: 'approval.delegate', name: 'Delegate Approvals', module: PERMISSION_MODULE.APPROVAL, action: 'delegate', groupSlug: PERMISSION_GROUP.APPROVAL, category: 'approvals', dependsOn: ['approval.execute'] },
  { code: 'approval.escalate', name: 'Escalate Approvals', module: PERMISSION_MODULE.APPROVAL, action: 'escalate', groupSlug: PERMISSION_GROUP.APPROVAL, category: 'approvals', dependsOn: ['approval.read'] },
  { code: 'approval.bulk', name: 'Bulk Approve', module: PERMISSION_MODULE.APPROVAL, action: 'bulk', groupSlug: PERMISSION_GROUP.APPROVAL, category: 'approvals', dependsOn: ['approval.execute'] },
  { code: 'workflow.read', name: 'Read Approval Workflows', module: PERMISSION_MODULE.APPROVAL, action: 'read', groupSlug: PERMISSION_GROUP.APPROVAL, category: 'workflows', dependsOn: ['approval.read'] },
  { code: 'workflow.manage', name: 'Manage Approval Workflows', module: PERMISSION_MODULE.APPROVAL, action: 'manage', groupSlug: PERMISSION_GROUP.APPROVAL, category: 'workflows', dependsOn: ['workflow.read'] },

  // Leave & Exit Management
  { code: 'leave.read', name: 'Read Leave Requests', module: PERMISSION_MODULE.LEAVE, action: 'read', groupSlug: PERMISSION_GROUP.LEAVE, category: 'leave' },
  { code: 'leave.create', name: 'Apply Leave', module: PERMISSION_MODULE.LEAVE, action: 'create', groupSlug: PERMISSION_GROUP.LEAVE, category: 'leave', dependsOn: ['leave.read'] },
  { code: 'leave.update', name: 'Update Leave Requests', module: PERMISSION_MODULE.LEAVE, action: 'update', groupSlug: PERMISSION_GROUP.LEAVE, category: 'leave', dependsOn: ['leave.read'] },
  { code: 'leave.delete', name: 'Delete Leave Requests', module: PERMISSION_MODULE.LEAVE, action: 'delete', groupSlug: PERMISSION_GROUP.LEAVE, category: 'leave', dependsOn: ['leave.read'] },
  { code: 'leave.approve', name: 'Approve Leave', module: PERMISSION_MODULE.LEAVE, action: 'approve', groupSlug: PERMISSION_GROUP.LEAVE, category: 'leave', dependsOn: ['approval.execute'] },
  { code: 'leave.policy.read', name: 'Read Leave Policies', module: PERMISSION_MODULE.LEAVE, action: 'read', groupSlug: PERMISSION_GROUP.LEAVE, category: 'policies', dependsOn: ['leave.read'] },
  { code: 'leave.policy.manage', name: 'Manage Leave Policies', module: PERMISSION_MODULE.LEAVE, action: 'manage', groupSlug: PERMISSION_GROUP.LEAVE, category: 'policies', dependsOn: ['leave.policy.read'] },
  { code: 'leave.balance.read', name: 'Read Leave Balances', module: PERMISSION_MODULE.LEAVE, action: 'read', groupSlug: PERMISSION_GROUP.LEAVE, category: 'balances', dependsOn: ['leave.read'] },
  { code: 'leave.balance.manage', name: 'Manage Leave Balances', module: PERMISSION_MODULE.LEAVE, action: 'manage', groupSlug: PERMISSION_GROUP.LEAVE, category: 'balances', dependsOn: ['leave.balance.read'] },
  { code: 'leave.calendar.read', name: 'Read Company Calendar', module: PERMISSION_MODULE.LEAVE, action: 'read', groupSlug: PERMISSION_GROUP.LEAVE, category: 'calendar', dependsOn: ['leave.read'] },
  { code: 'resignation.read', name: 'Read Resignations', module: PERMISSION_MODULE.LEAVE, action: 'read', groupSlug: PERMISSION_GROUP.LEAVE, category: 'resignation', dependsOn: ['leave.read'] },
  { code: 'resignation.create', name: 'Submit Resignation', module: PERMISSION_MODULE.LEAVE, action: 'create', groupSlug: PERMISSION_GROUP.LEAVE, category: 'resignation', dependsOn: ['resignation.read'] },
  { code: 'resignation.update', name: 'Update Resignation', module: PERMISSION_MODULE.LEAVE, action: 'update', groupSlug: PERMISSION_GROUP.LEAVE, category: 'resignation', dependsOn: ['resignation.read'] },
  { code: 'resignation.approve', name: 'Approve Resignation', module: PERMISSION_MODULE.LEAVE, action: 'approve', groupSlug: PERMISSION_GROUP.LEAVE, category: 'resignation', dependsOn: ['approval.execute'] },
  { code: 'exit.read', name: 'Read Exit Process', module: PERMISSION_MODULE.LEAVE, action: 'read', groupSlug: PERMISSION_GROUP.LEAVE, category: 'exit', dependsOn: ['resignation.read'] },
  { code: 'exit.manage', name: 'Manage Exit Process', module: PERMISSION_MODULE.LEAVE, action: 'manage', groupSlug: PERMISSION_GROUP.LEAVE, category: 'exit', dependsOn: ['exit.read'] },

  // Attendance
  ...dotCrud(PERMISSION_MODULE.ATTENDANCE, 'attendance', PERMISSION_GROUP.ATTENDANCE, 'attendance', 'Attendance'),
  { code: 'attendance.approve', name: 'Approve Attendance', module: PERMISSION_MODULE.ATTENDANCE, action: 'approve', groupSlug: PERMISSION_GROUP.ATTENDANCE, category: 'attendance', dependsOn: ['attendance.read'] },
  ...dotCrud(PERMISSION_MODULE.ATTENDANCE, 'shift', PERMISSION_GROUP.ATTENDANCE, 'shifts', 'Shift'),

  // Payroll
  ...dotCrud(PERMISSION_MODULE.PAYROLL, 'payroll', PERMISSION_GROUP.PAYROLL, 'payroll', 'Payroll Run'),
  ...dotCrud(PERMISSION_MODULE.PAYROLL, 'payslip', PERMISSION_GROUP.PAYROLL, 'payslips', 'Payslip'),
  { code: 'payroll.process', name: 'Process Payroll', module: PERMISSION_MODULE.PAYROLL, action: 'process', groupSlug: PERMISSION_GROUP.PAYROLL, category: 'payroll', dependsOn: ['payroll.read'] },

  // Sales
  ...dotCrud(PERMISSION_MODULE.SALES, 'lead', PERMISSION_GROUP.SALES, 'leads', 'Lead'),
  ...dotCrud(PERMISSION_MODULE.SALES, 'deal', PERMISSION_GROUP.SALES, 'deals', 'Deal'),
  ...dotCrud(PERMISSION_MODULE.SALES, 'pipeline', PERMISSION_GROUP.SALES, 'pipelines', 'Pipeline'),

  // Chat
  ...dotCrud(PERMISSION_MODULE.CHAT, 'conversation', PERMISSION_GROUP.CHAT, 'conversations', 'Conversation'),
  { code: 'chat.message.send', name: 'Send Messages', module: PERMISSION_MODULE.CHAT, action: 'send', groupSlug: PERMISSION_GROUP.CHAT, category: 'messages' },

  // Notifications
  ...dotCrud(PERMISSION_MODULE.NOTIFICATIONS, 'notification', PERMISSION_GROUP.NOTIFICATIONS, 'notifications', 'Notification'),
  { code: 'notifications.broadcast', name: 'Broadcast Notifications', module: PERMISSION_MODULE.NOTIFICATIONS, action: 'broadcast', groupSlug: PERMISSION_GROUP.NOTIFICATIONS, category: 'notifications', dependsOn: ['notification.read'] },

  // Analytics
  { code: 'analytics.dashboard.read', name: 'View Dashboards', module: PERMISSION_MODULE.ANALYTICS, action: 'read', groupSlug: PERMISSION_GROUP.ANALYTICS, category: 'dashboards' },
  { code: 'analytics.report.read', name: 'View Reports', module: PERMISSION_MODULE.ANALYTICS, action: 'read', groupSlug: PERMISSION_GROUP.ANALYTICS, category: 'reports' },
  { code: 'analytics.report.export', name: 'Export Reports', module: PERMISSION_MODULE.ANALYTICS, action: 'export', groupSlug: PERMISSION_GROUP.ANALYTICS, category: 'reports', dependsOn: ['analytics.report.read'] },

  // System
  { code: 'system.audit.read', name: 'Read Audit Logs', module: PERMISSION_MODULE.SYSTEM, action: 'read', groupSlug: PERMISSION_GROUP.SYSTEM, category: 'audit' },
  { code: 'system.config.read', name: 'Read System Config', module: PERMISSION_MODULE.SYSTEM, action: 'read', groupSlug: PERMISSION_GROUP.SYSTEM, category: 'config' },
  { code: 'system.config.manage', name: 'Manage System Config', module: PERMISSION_MODULE.SYSTEM, action: 'manage', groupSlug: PERMISSION_GROUP.SYSTEM, category: 'config', dependsOn: ['system.config.read'] },
];

export function getCatalogEntryByCode(code: string): EnterprisePermissionEntry | undefined {
  return ENTERPRISE_PERMISSION_CATALOG.find((entry) => entry.code === code);
}

export function getAllPermissionCodes(): string[] {
  return ENTERPRISE_PERMISSION_CATALOG.map((entry) => entry.code);
}
