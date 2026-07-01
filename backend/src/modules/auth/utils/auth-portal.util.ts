const ENTERPRISE_PORTAL_PERMISSIONS = [
  'company.read',
  'rbac.role.read',
  'settings.manage',
  'system.config.read',
  'system.audit.read',
  'workflow.manage',
] as const;

/** Permissions that indicate HR/management portal access — not self-service employee signals. */
const MANAGER_PORTAL_PERMISSIONS = [
  'employee.create',
  'employee.update',
  'employee.delete',
  'employee.import',
  'employee.export',
  'candidate.read',
  'project.dashboard.read',
  'leave.approve',
  'attendance.approve',
  'payroll.process',
  'lead.read',
] as const;

export type AuthPortalType = 'enterprise' | 'manager' | 'workspace';

export function resolveAuthPortal(
  permissions: string[],
  isSuperAdmin: boolean,
): AuthPortalType {
  if (isSuperAdmin) {
    return 'enterprise';
  }

  const permissionSet = new Set(permissions);

  if (ENTERPRISE_PORTAL_PERMISSIONS.some((code) => permissionSet.has(code))) {
    return 'enterprise';
  }

  if (MANAGER_PORTAL_PERMISSIONS.some((code) => permissionSet.has(code))) {
    return 'manager';
  }

  return 'workspace';
}

export function getAuthPortalHomeRoute(portal: AuthPortalType): string {
  switch (portal) {
    case 'enterprise':
      return '/enterprise';
    case 'manager':
      return '/manager';
    default:
      return '/workspace';
  }
}
