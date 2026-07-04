import {
  EmployeeRoleRepository,
  PermissionRepository,
  RolePermissionRepository,
  RoleRepository,
} from '@domain/permission/permission.schemas.js';
import { DEFAULT_ROLE_CATALOG } from '@modules/rbac/constants/role-catalog.constants.js';
import { SYSTEM_ROLE_SLUG } from '@modules/rbac/constants/rbac.constants.js';
import { RoleAssignmentService } from '@modules/rbac/services/role-assignment.service.js';
import { PermissionCacheService } from '@modules/rbac/services/permission-cache.service.js';
import type { RbacActorContext } from '@modules/rbac/types/rbac.types.js';
import { MongoServerError } from 'mongodb';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { logger } from '@logging/winston.logger.js';

const SYSTEM_ACTOR = 'system';

async function syncEmployeeRolePermissions(companyId: string): Promise<void> {
  const roleDef = DEFAULT_ROLE_CATALOG.find((entry) => entry.slug === SYSTEM_ROLE_SLUG.EMPLOYEE);
  if (!roleDef?.permissionCodes?.length) {
    return;
  }

  const role = await RoleRepository.findOne({ slug: SYSTEM_ROLE_SLUG.EMPLOYEE }, { companyId });
  if (!role) {
    return;
  }

  const permissions = await PermissionRepository.findMany({ code: { $in: roleDef.permissionCodes } });
  const existing = await RolePermissionRepository.findMany({ roleId: role.id }, { companyId });
  const assigned = new Set(existing.map((entry) => entry.permissionId));

  for (const permission of permissions) {
    if (assigned.has(permission.id)) {
      continue;
    }
    try {
      await RolePermissionRepository.create(
        {
          id: generateUuid(),
          companyId,
          roleId: role.id,
          permissionId: permission.id,
          createdBy: SYSTEM_ACTOR,
          updatedBy: SYSTEM_ACTOR,
        },
        { companyId },
      );
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        continue;
      }
      throw error;
    }
  }
}

export const EmployeeProvisioningService = {
  async refreshEmployeePortalAccess(companyId: string, employeeId: string): Promise<void> {
    await syncEmployeeRolePermissions(companyId);
    await PermissionCacheService.invalidate(companyId, employeeId);
  },

  async ensureDefaultEmployeeRole(
    companyId: string,
    employeeId: string,
    actor: RbacActorContext,
  ): Promise<boolean> {
    await syncEmployeeRolePermissions(companyId);

    const assignments = await EmployeeRoleRepository.findMany(
      { employeeId, effectiveTo: null },
      { companyId },
    );
    if (assignments.length > 0) {
      await PermissionCacheService.invalidate(companyId, employeeId);
      return false;
    }

    const role = await RoleRepository.findOne({ slug: SYSTEM_ROLE_SLUG.EMPLOYEE }, { companyId });
    if (!role) {
      logger.warn('Default employee role not found — user will have no portal access', {
        companyId,
        employeeId,
      });
      return false;
    }

    await RoleAssignmentService.assignRoleToEmployee(companyId, employeeId, role.id, actor, {
      isPrimary: true,
    });
    return true;
  },
};