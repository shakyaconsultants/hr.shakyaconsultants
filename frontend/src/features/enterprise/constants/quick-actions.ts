import type { LucideIcon } from 'lucide-react';
import {
  Briefcase,
  Building2,
  CalendarDays,
  Clock,
  FolderKanban,
  GitBranch,
  Megaphone,
  Shield,
  UserPlus,
  Users,
  Workflow,
} from 'lucide-react';
import { ROUTES } from '@/config/app.config';
import { buildWizardStepUrl } from '@/features/admin/constants/wizard-steps';

export interface EnterpriseQuickAction {
  id: string;
  label: string;
  description: string;
  path: string;
  icon: LucideIcon;
  permission?: string;
  permissionsAny?: string[];
}

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
    id: 'branch',
    label: 'Branch',
    description: 'Add via company setup wizard',
    path: `${ROUTES.organizationEntity('branch')}?action=create`,
    icon: Building2,
    permission: 'branch.create',
  },
  {
    id: 'department',
    label: 'Department',
    description: 'Add via company setup wizard',
    path: `${ROUTES.organizationEntity('department')}?action=create`,
    icon: GitBranch,
    permission: 'department.create',
  },
  {
    id: 'designation',
    label: 'Designation',
    description: 'Add via company setup wizard',
    path: buildWizardStepUrl('designation'),
    icon: Users,
    permission: 'designation.create',
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
  {
    id: 'holiday',
    label: 'Holiday',
    description: 'Add via company setup wizard',
    path: buildWizardStepUrl('holiday'),
    icon: CalendarDays,
    permission: 'holiday.create',
  },
  {
    id: 'work-shift',
    label: 'Work Shift',
    description: 'Add via company setup wizard',
    path: buildWizardStepUrl('work-shift'),
    icon: Clock,
    permission: 'work-shift.create',
  },
  {
    id: 'announcement',
    label: 'Announcement',
    description: 'Publish a company-wide announcement',
    path: ROUTES.COMMUNICATION_ADMIN,
    icon: Megaphone,
    permissionsAny: ['notifications.broadcast', 'announcement.create'],
  },
];
