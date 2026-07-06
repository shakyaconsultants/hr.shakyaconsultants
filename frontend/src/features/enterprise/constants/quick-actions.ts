import type { LucideIcon } from 'lucide-react';
import { Briefcase, CalendarDays, FolderKanban, Shield, UserPlus, Workflow } from 'lucide-react';
import { ROUTES } from '@/config/app.config';

export interface EnterpriseQuickAction {
  id: string;
  label: string;
  description: string;
  path: string;
  icon: LucideIcon;
  permission?: string;
  permissionsAny?: string[];
}

/** Core admin actions — org master data lives under Organization Setup. */
export const ENTERPRISE_QUICK_ACTIONS: EnterpriseQuickAction[] = [
  {
    id: 'employee',
    label: 'Employee',
    description: 'Onboard a new employee',
    path: `${ROUTES.EMPLOYEES}?action=create`,
    icon: UserPlus,
    permission: 'employee.create',
  },
  {
    id: 'candidate',
    label: 'Candidate',
    description: 'Add a recruitment candidate',
    path: `${ROUTES.RECRUITMENT_CANDIDATES}?action=create`,
    icon: Briefcase,
    permission: 'candidate.create',
  },
  {
    id: 'holiday',
    label: 'Holiday',
    description: 'Add a holiday to the calendar',
    path: `${ROUTES.organizationEntity('holiday')}?action=create`,
    icon: CalendarDays,
    permission: 'holiday.create',
  },
  {
    id: 'project',
    label: 'Project',
    description: 'Create a new project',
    path: ROUTES.PROJECTS_CREATE,
    icon: FolderKanban,
    permission: 'project.create',
  },
  {
    id: 'role',
    label: 'Role',
    description: 'Define a new RBAC role',
    path: `${ROUTES.RBAC_ROLES}?action=create`,
    icon: Shield,
    permission: 'rbac.role.create',
  },
  {
    id: 'workflow',
    label: 'Workflow',
    description: 'Configure an approval workflow',
    path: `${ROUTES.APPROVAL_WORKFLOWS}?action=create`,
    icon: Workflow,
    permission: 'workflow.manage',
  },
];
