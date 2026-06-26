export interface RbacActorContext {
  companyId: string;
  userId: string;
  employeeId?: string;
  ip?: string;
  userAgent?: string;
}

export interface PermissionSimulatorInput {
  roleIds?: string[];
  permissionCodes?: string[];
  employeeId?: string;
}

export interface PermissionSimulatorResult {
  effectivePermissions: string[];
  missingDependencies: string[];
  extraFromRoles: string[];
  isSuperAdmin: boolean;
}

export interface RoleComparisonResult {
  roleA: { id: string; name: string; permissions: string[] };
  roleB: { id: string; name: string; permissions: string[] };
  onlyInA: string[];
  onlyInB: string[];
  shared: string[];
}
