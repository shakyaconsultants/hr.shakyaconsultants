import {
  ENTERPRISE_PERMISSION_CATALOG,
  getCatalogEntryByCode,
} from '@modules/rbac/constants/enterprise-permission-catalog.constants.js';
import { EffectivePermissionService } from '@modules/rbac/services/effective-permission.service.js';
import type {
  PermissionSimulatorInput,
  PermissionSimulatorResult,
} from '@modules/rbac/types/rbac.types.js';
import { RoleRepository } from '@domain/permission/permission.schemas.js';
import { SYSTEM_ROLE_SLUG } from '@modules/rbac/constants/rbac.constants.js';

export const PermissionSimulatorService = {
  async simulate(companyId: string, input: PermissionSimulatorInput): Promise<PermissionSimulatorResult> {
    let effectivePermissions: string[] = [];
    let isSuperAdmin = false;

    if (input.employeeId) {
      const result = await EffectivePermissionService.calculateForEmployee(companyId, input.employeeId);
      effectivePermissions = result.permissions;
      isSuperAdmin = result.isSuperAdmin;
    }

    if (input.roleIds && input.roleIds.length > 0) {
      const roles = await RoleRepository.findMany({ id: { $in: input.roleIds } }, { companyId });
      isSuperAdmin = roles.some((r) => r.slug === SYSTEM_ROLE_SLUG.SUPER_ADMIN);

      if (isSuperAdmin) {
        effectivePermissions = ENTERPRISE_PERMISSION_CATALOG.map((e) => e.code);
      } else {
        const fromRoles = await EffectivePermissionService.calculateForRoleIds(companyId, input.roleIds);
        effectivePermissions = [...new Set([...effectivePermissions, ...fromRoles])];
      }
    }

    if (input.permissionCodes && input.permissionCodes.length > 0) {
      effectivePermissions = [...new Set([...effectivePermissions, ...input.permissionCodes])];
    }

    effectivePermissions = EffectivePermissionService.resolveDependencies(effectivePermissions);

    const missingDependencies: string[] = [];
    for (const code of effectivePermissions) {
      const entry = getCatalogEntryByCode(code);
      for (const dep of entry?.dependsOn ?? []) {
        if (!effectivePermissions.includes(dep) && !missingDependencies.includes(dep)) {
          missingDependencies.push(dep);
        }
      }
    }

    const extraFromRoles = input.permissionCodes
      ? input.permissionCodes.filter((code) => effectivePermissions.includes(code))
      : [];

    return {
      effectivePermissions: effectivePermissions.sort(),
      missingDependencies,
      extraFromRoles,
      isSuperAdmin,
    };
  },

  async compareWithRequired(
    companyId: string,
    input: PermissionSimulatorInput,
    requiredPermissions: string[],
  ): Promise<{ hasAll: boolean; missing: string[]; effective: string[] }> {
    const result = await this.simulate(companyId, input);
    const missing = requiredPermissions.filter((p) => !result.effectivePermissions.includes(p));
    return {
      hasAll: missing.length === 0,
      missing,
      effective: result.effectivePermissions,
    };
  },
};
