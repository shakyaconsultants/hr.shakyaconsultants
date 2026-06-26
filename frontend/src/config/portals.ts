import { ROUTES } from '@/config/app.config';

export const PORTAL = {
  ENTERPRISE: 'enterprise',
  MANAGER: 'manager',
  WORKSPACE: 'workspace',
} as const;

export type PortalType = (typeof PORTAL)[keyof typeof PORTAL];

/** Permission signals for company-level administration — no role names in UI. */
export const ENTERPRISE_PORTAL_PERMISSIONS = [
  'company.read',
  'rbac.role.read',
  'settings.manage',
  'system.config.read',
  'system.audit.read',
  'workflow.manage',
] as const;

/** Permission signals for team / operational management. */
export const MANAGER_PORTAL_PERMISSIONS = [
  'employee.read',
  'candidate.read',
  'project.dashboard.read',
  'approval.read',
  'leave.read',
] as const;

export function resolvePortal(hasAnyPermission: (codes: string[]) => boolean): PortalType {
  if (hasAnyPermission([...ENTERPRISE_PORTAL_PERMISSIONS])) {
    return PORTAL.ENTERPRISE;
  }
  if (hasAnyPermission([...MANAGER_PORTAL_PERMISSIONS])) {
    return PORTAL.MANAGER;
  }
  return PORTAL.WORKSPACE;
}

export function getPortalHomeRoute(portal: PortalType): string {
  switch (portal) {
    case PORTAL.ENTERPRISE:
      return ROUTES.ENTERPRISE;
    case PORTAL.MANAGER:
      return ROUTES.MANAGER;
    default:
      return ROUTES.WORKSPACE;
  }
}

export function getPortalLabel(portal: PortalType): string {
  switch (portal) {
    case PORTAL.ENTERPRISE:
      return 'Enterprise';
    case PORTAL.MANAGER:
      return 'Manager';
    default:
      return 'Workspace';
  }
}
