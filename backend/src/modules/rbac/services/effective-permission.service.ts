import {
  EmployeeRoleRepository,
  PermissionRepository,
  RolePermissionRepository,
  RoleRepository,
} from '@domain/permission/permission.schemas.js';
import {
  ENTERPRISE_PERMISSION_CATALOG,
  getCatalogEntryByCode,
} from '@modules/rbac/constants/enterprise-permission-catalog.constants.js';
import { SYSTEM_ROLE_SLUG } from '@modules/rbac/constants/rbac.constants.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';

export interface EffectivePermissionResult {
  permissions: string[];
  resolvedDependencies: string[];
  roleIds: string[];
  isSuperAdmin: boolean;
}

export const EffectivePermissionService = {
  resolveDependencies(codes: string[]): string[] {
    const resolved = new Set(codes);
    let changed = true;

    while (changed) {
      changed = false;
      for (const code of [...resolved]) {
        const entry = getCatalogEntryByCode(code);
        const deps = entry?.dependsOn ?? [];
        for (const dep of deps) {
          if (!resolved.has(dep)) {
            resolved.add(dep);
            changed = true;
          }
        }
      }
    }

    return [...resolved].sort();
  },

  async calculateForEmployee(companyId: string, employeeId: string): Promise<EffectivePermissionResult> {
    const employeeRoles = await EmployeeRoleRepository.findMany(
      { employeeId, effectiveTo: null },
      { companyId },
    );

    if (employeeRoles.length === 0) {
      return { permissions: [], resolvedDependencies: [], roleIds: [], isSuperAdmin: false };
    }

    const roleIds = employeeRoles.map((entry) => entry.roleId);
    const roles = await RoleRepository.findMany(
      { id: { $in: roleIds }, status: ENTITY_STATUS.ACTIVE, isArchived: false },
      { companyId },
    );

    const isSuperAdmin = roles.some((role) => role.slug === SYSTEM_ROLE_SLUG.SUPER_ADMIN);
    if (isSuperAdmin) {
      const allCodes = ENTERPRISE_PERMISSION_CATALOG.map((entry) => entry.code);
      const permissions = this.resolveDependencies(allCodes);
      return { permissions, resolvedDependencies: permissions, roleIds, isSuperAdmin: true };
    }

    const activeRoleIds = roles.map((role) => role.id);
    const rolePermissions = await RolePermissionRepository.findMany(
      { roleId: { $in: activeRoleIds } },
      { companyId },
    );

    if (rolePermissions.length === 0) {
      return { permissions: [], resolvedDependencies: [], roleIds: activeRoleIds, isSuperAdmin: false };
    }

    const permissionIds = [...new Set(rolePermissions.map((entry) => entry.permissionId))];
    const permissions = await PermissionRepository.findMany(
      { id: { $in: permissionIds }, status: ENTITY_STATUS.ACTIVE },
    );

    const baseCodes = [...new Set(permissions.map((entry) => entry.code))];
    for (const permission of permissions) {
      for (const dep of permission.dependsOn) {
        baseCodes.push(dep);
      }
    }

    const resolved = this.resolveDependencies(baseCodes);
    return {
      permissions: resolved,
      resolvedDependencies: resolved,
      roleIds: activeRoleIds,
      isSuperAdmin: false,
    };
  },

  async calculateForRoleIds(companyId: string, roleIds: string[]): Promise<string[]> {
    if (roleIds.length === 0) {
      return [];
    }

    const roles = await RoleRepository.findMany({ id: { $in: roleIds } }, { companyId });
    if (roles.some((role) => role.slug === SYSTEM_ROLE_SLUG.SUPER_ADMIN)) {
      return this.resolveDependencies(ENTERPRISE_PERMISSION_CATALOG.map((e) => e.code));
    }

    const rolePermissions = await RolePermissionRepository.findMany(
      { roleId: { $in: roleIds } },
      { companyId },
    );

    const permissionIds = [...new Set(rolePermissions.map((entry) => entry.permissionId))];
    const permissions = await PermissionRepository.findMany(
      { id: { $in: permissionIds }, status: ENTITY_STATUS.ACTIVE },
    );

    const codes = permissions.map((entry) => entry.code);
    for (const permission of permissions) {
      codes.push(...permission.dependsOn);
    }

    return this.resolveDependencies(codes);
  },
};
